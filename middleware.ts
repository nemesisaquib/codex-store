import { NextRequest, NextResponse } from "next/server";

// Standard Next.js config matcher for global middleware
export const config = {
  matcher: [
    // Protect everything except static assets and standard image/logo folders
    "/((?!_next/static|_next/image|favicon.ico|brand|Logo|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf)).*)",
  ],
};

// Secret token to sign logging requests
const FIREWALL_SECRET = "firewall-internal-secret-key-12345";

// Static WAF Threat Patterns (Regex)
const SQLI_REGEX = /(union\s+select|select\s+.*\s+from|insert\s+into|drop\s+table|delete\s+from|alter\s+table|update\s+.*\s+set|'or\s+'\d+'\s*=\s*'\d+)/i;
const XSS_REGEX = /(<script|javascript:|onload\s*=|onerror\s*=|alert\(|document\.cookie|eval\(|unescape\()/i;
const TRAVERSAL_REGEX = /(\.\.\/|\.\.\\|\/etc\/passwd|\/win\.ini|\/boot\.ini)/i;

// Malicious / Scraper Bot User-Agents
const BOT_REGEX = /(curl|wget|python|scrapy|apachebench|slowloris|nmap|zgrab|masscan|censys|go-http-client|headless|puppeteer|selenium|nikto|sqlmap)/i;

// Helper to query settings from Turso database via HTTP REST to prevent Edge native module errors
async function getFirewallSettings() {
  const defaults = {
    waf_enabled: true,
    ddos_shield_enabled: true,
    bot_block_enabled: true,
    api_limit_enabled: true,
    rate_limit_rpm: 60,
    blocked_countries: ["KP", "IR", "SY"]
  };

  const rawUrl = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;

  if (!rawUrl || !token || rawUrl.startsWith("file:")) {
    // Return defaults for local SQLite dev environment
    return defaults;
  }

  try {
    const httpUrl = rawUrl.replace("libsql://", "https://") + "/v1/query";
    const res = await fetch(httpUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        statements: ["SELECT key, value FROM firewall_settings"]
      }),
      // short cache to avoid spamming Turso but maintain reactivity
      next: { revalidate: 15 } 
    } as any);

    if (!res.ok) return defaults;

    const data = await res.json();
    const rows = data.results?.[0]?.response?.rows || [];
    
    const settings: Record<string, string> = {};
    for (const row of rows) {
      if (row[0] && row[1]) {
        settings[row[0].value || row[0]] = row[1].value || row[1];
      }
    }

    return {
      waf_enabled: settings.waf_enabled !== "false",
      ddos_shield_enabled: settings.ddos_shield_enabled !== "false",
      bot_block_enabled: settings.bot_block_enabled !== "false",
      api_limit_enabled: settings.api_limit_enabled !== "false",
      rate_limit_rpm: parseInt(settings.rate_limit_rpm || "60", 10),
      blocked_countries: (settings.blocked_countries || "KP,IR,SY").split(",").map(c => c.trim().toUpperCase())
    };
  } catch (e) {
    console.warn("Failed to fetch firewall settings from Turso, using defaults:", e);
    return defaults;
  }
}

// Log threat details to node database via internal API
async function logThreat(req: NextRequest, details: { ip: string; method: string; url: string; country: string; rule: string; action: string }) {
  try {
    const logApiUrl = new URL("/api/admin/firewall/log", req.nextUrl.origin).toString();
    await fetch(logApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-firewall-secret": FIREWALL_SECRET
      },
      body: JSON.stringify(details)
    });
  } catch (e) {
    console.error("Failed to post firewall log:", e);
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Bypass checks for logging endpoint to prevent recursion loops
  if (pathname === "/api/admin/firewall/log") {
    return NextResponse.next();
  }

  // Retrieve client information
  const ip = req.ip || req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1";
  const userAgent = req.headers.get("user-agent") || "";
  const country = (req.geo?.country || req.headers.get("x-vercel-ip-country") || "US").toUpperCase();
  const method = req.method;

  // Retrieve dynamic firewall settings
  const settings = await getFirewallSettings();

  // ─── 1. BOT MANAGEMENT ───
  if (settings.bot_block_enabled && BOT_REGEX.test(userAgent)) {
    await logThreat(req, {
      ip,
      method,
      url: pathname + search,
      country,
      rule: `Bot Detected: User-Agent Match (${userAgent.substring(0, 30)}...)`,
      action: "BLOCKED"
    });
    return new NextResponse("Access Blocked: Malicious Bot Detected 🤖", { status: 403 });
  }

  // ─── 2. GEO-BLOCKING ───
  if (settings.blocked_countries.includes(country)) {
    await logThreat(req, {
      ip,
      method,
      url: pathname + search,
      country,
      rule: `Geo-Block: Blocked Country (${country})`,
      action: "BLOCKED"
    });
    return new NextResponse("Access Denied: This service is unavailable in your region 🌍", { status: 403 });
  }

  // ─── 3. WEB APPLICATION FIREWALL (WAF) ───
  if (settings.waf_enabled) {
    const decodedUrl = decodeURIComponent(pathname + search);
    
    let wafTriggered = false;
    let ruleBreached = "";

    if (SQLI_REGEX.test(decodedUrl)) {
      wafTriggered = true;
      ruleBreached = "SQL Injection Attempt (WAF)";
    } else if (XSS_REGEX.test(decodedUrl)) {
      wafTriggered = true;
      ruleBreached = "Cross-Site Scripting (XSS) (WAF)";
    } else if (TRAVERSAL_REGEX.test(decodedUrl)) {
      wafTriggered = true;
      ruleBreached = "Path Traversal Attack (WAF)";
    }

    if (wafTriggered) {
      await logThreat(req, {
        ip,
        method,
        url: pathname + search,
        country,
        rule: ruleBreached,
        action: "BLOCKED"
      });
      return new NextResponse("Access Blocked: Security Threat Detected 🛡️", { status: 403 });
    }
  }

  // ─── 4. RATE LIMITING (DDoS Mitigation) ───
  // Limit API routes & checkout pages
  const isTargetForLimiting = pathname.startsWith("/api/") || pathname === "/checkout" || pathname === "/auth/login" || pathname === "/auth/register";
  if (settings.ddos_shield_enabled && isTargetForLimiting) {
    const now = Date.now();
    const rateLimitCookie = req.cookies.get("fw_reqs")?.value;
    let requestsCount = 1;
    let windowStart = now;

    if (rateLimitCookie) {
      const [ts, count] = rateLimitCookie.split("_").map(Number);
      if (now - ts < 60000) {
        requestsCount = count + 1;
        windowStart = ts;
      }
    }

    if (requestsCount > settings.rate_limit_rpm) {
      await logThreat(req, {
        ip,
        method,
        url: pathname + search,
        country,
        rule: `DDoS Mitigation: Rate Limit Exceeded (${requestsCount}/${settings.rate_limit_rpm} rpm)`,
        action: "CHALLENGED"
      });
      return new NextResponse("Access Blocked: Too Many Requests. Rate Limit Exceeded ⏳", { status: 429 });
    }

    // Write updated count back to cookie
    const response = NextResponse.next();
    response.cookies.set("fw_reqs", `${windowStart}_${requestsCount}`, {
      maxAge: 60,
      path: "/",
      httpOnly: true,
      sameSite: "lax"
    });

    // Inject security headers
    injectSecurityHeaders(response);
    return response;
  }

  // ─── 5. ADMIN AUTH ROUTE ROUTING ───
  const isFrontendAdmin = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isBackendAdminAPI = pathname.startsWith("/api/admin") && pathname !== "/api/auth/admin"; // Exempt login endpoint

  if (isFrontendAdmin || isBackendAdminAPI) {
    const session = req.cookies.get("admin_session")?.value;
    if (!session) {
      if (isBackendAdminAPI) {
        return new NextResponse(JSON.stringify({ error: "Unauthorized API Access" }), { 
          status: 401, 
          headers: { "Content-Type": "application/json" } 
        });
      } else {
        const url = req.nextUrl.clone();
        url.pathname = "/admin/login";
        return NextResponse.redirect(url);
      }
    }
  }

  if (pathname === "/admin/login") {
    const session = req.cookies.get("admin_session")?.value;
    if (session) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  // Normal request flow
  const response = NextResponse.next();
  injectSecurityHeaders(response);
  return response;
}

// Inject robust security headers
function injectSecurityHeaders(res: NextResponse) {
  res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  // CSP: standard secure baseline allowing external images
  res.headers.set("Content-Security-Policy", "upgrade-insecure-requests; default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * data: blob:;");
}

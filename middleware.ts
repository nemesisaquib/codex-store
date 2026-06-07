import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin routes (except login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = req.cookies.get("admin_session")?.value;
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  // Already logged in → skip login page
  if (pathname === "/admin/login") {
    const session = req.cookies.get("admin_session")?.value;
    if (session) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};

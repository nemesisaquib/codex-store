import { NextRequest, NextResponse } from "next/server";
import { sendEmail, emailTemplate, getSmtpConfig } from "@/lib/email";

export async function GET() {
  const cfg = getSmtpConfig();
  return NextResponse.json({
    configured: !!cfg,
    host: cfg?.host ?? null,
    fromEmail: cfg?.fromEmail ?? null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { to } = await req.json();
    if (!to || !to.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid recipient" }, { status: 400 });
    }
    const html = emailTemplate(
      "SMTP Test Successful ✅",
      "<p>Your CODEX admin SMTP configuration is working correctly. Transactional emails are ready to send.</p><p style='color:#a3a3a3;font-size:13px;margin-top:16px'>This is an automated test message.</p>",
      { label: "Open Admin", url: "http://localhost:3004/admin" }
    );
    const result = await sendEmail(to, "CODEX — SMTP Test", html);
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

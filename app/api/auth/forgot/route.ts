import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { sendEmail, emailTemplate, getSmtpConfig } from "@/lib/email";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const db = getDb();
    const customer = db.prepare("SELECT id,first_name FROM customers WHERE email=?").get(email) as {id:string;first_name:string}|undefined;

    // Always return ok — don't reveal if email exists (security)
    if (!customer) {
      return NextResponse.json({ ok: true });
    }

    // Create reset token — 15 min expiry
    const token = randomUUID();
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    db.prepare("INSERT INTO reset_tokens (token,customer_id,expires) VALUES (?,?,?)").run(token, customer.id, expires);

    // Send email if SMTP configured
    if (getSmtpConfig()) {
      const url = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004"}/auth/reset?token=${token}`;
      const html = emailTemplate(
        "Reset your CODEX password",
        `<p>Hi ${customer.first_name},</p><p>We received a request to reset your password. Click the button below to choose a new one. This link expires in 15 minutes.</p><p style="color:#a3a3a3;font-size:13px;margin-top:16px">If you didn't request this, ignore this email — your password won't change.</p>`,
        { label: "Reset Password", url }
      );
      await sendEmail(email, "Reset your CODEX password", html);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

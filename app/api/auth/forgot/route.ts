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
    const customer = (await db.execute({ sql: "SELECT id,first_name FROM customers WHERE email=?", args: [email] })).rows[0] as {id:string;first_name:string}|undefined;

    // Always return ok — don't reveal if email exists (security)
    if (!customer) {
      return NextResponse.json({ ok: true });
    }

    // Create reset token — 15 min expiry
    const token = randomUUID();
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await db.execute({ sql: "INSERT INTO reset_tokens (token,customer_id,expires) VALUES (?,?,?)", args: [token, customer.id, expires] });

    // Send email if SMTP configured
    if (getSmtpConfig()) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3004"));
      const url = `${baseUrl}/auth/reset?token=${token}`;
      const html = emailTemplate(
        "Reset your E-shop password",
        `<p>Hi ${customer.first_name},</p><p>We received a request to reset your password. Click the button below to choose a new one. This link expires in 15 minutes.</p><p style="color:#a3a3a3;font-size:13px;margin-top:16px">If you didn't request this, ignore this email — your password won't change.</p>`,
        { label: "Reset Password", url }
      );
      await sendEmail(email, "Reset your E-shop password", html);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

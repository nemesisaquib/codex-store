import { NextRequest, NextResponse } from "next/server";
import { sendEmail, emailTemplate } from "@/lib/email";

/** Send bulk/segment email from CRM */
export async function POST(req: NextRequest) {
  try {
    const { recipients, subject, heading, body, cta } = await req.json();
    if (!Array.isArray(recipients) || !recipients.length) {
      return NextResponse.json({ ok: false, error: "No recipients" }, { status: 400 });
    }
    const html = emailTemplate(heading || subject, body || "", cta);
    let sent = 0, failed = 0;
    for (const to of recipients) {
      const r = await sendEmail(to, subject, html);
      r.ok ? sent++ : failed++;
    }
    return NextResponse.json({ ok: true, sent, failed });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

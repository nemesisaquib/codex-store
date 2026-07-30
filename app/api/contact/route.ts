import { NextRequest, NextResponse } from "next/server";
import { sendEmail, contactFormTemplate } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ ok: false, error: "Missing required fields (name, email, message)" }, { status: 400 });
    }

    const html = contactFormTemplate({ name, email, subject, message });

    // Send notification to site admin & acknowledgment to user
    const result = await sendEmail(email, `Contact Inquiry Received: ${subject || "General Inquiry"}`, html);

    return NextResponse.json({
      ok: true,
      message: "Thank you for reaching out! Your message has been sent.",
      mailStatus: result,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

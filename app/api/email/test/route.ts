import { NextRequest, NextResponse } from "next/server";
import {
  sendEmail,
  emailTemplate,
  getSmtpConfig,
  orderBookingTemplate,
  orderCancellationTemplate,
  orderDeliveryTemplate,
  contactFormTemplate,
} from "@/lib/email";

export async function GET() {
  const cfg = await getSmtpConfig();
  return NextResponse.json({
    configured: !!cfg,
    host: cfg?.host ?? "Ethereal Test Server (Auto)",
    fromEmail: cfg?.fromEmail ?? "auto-generated",
    isTest: !cfg || cfg.isTestAccount,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const to = body.to || "test@example.com";
    const templateType = body.template || "test";
    const forceTest = body.forceTest ?? false;

    let html = "";
    let subject = "E-shop Email Test";

    switch (templateType) {
      case "booking":
        subject = "Order Booking Confirmation — #COD-2026-98412";
        html = orderBookingTemplate({
          orderNumber: "COD-2026-98412",
          customerName: "Alex Morgan",
          total: 189.99,
          items: [
            { name: "Nike Air Jordan 1 High OG", quantity: 1, price: 149.99 },
            { name: "Cotton Casual T-Shirt", quantity: 2, price: 20.0 },
          ],
          shippingAddress: "123 Fashion Blvd, Suite 400, New York, NY 10001",
        });
        break;

      case "cancellation":
        subject = "Order Cancelled — #COD-2026-98412";
        html = orderCancellationTemplate({
          orderNumber: "COD-2026-98412",
          customerName: "Alex Morgan",
          reason: "Customer requested cancellation prior to dispatch.",
          refundAmount: 189.99,
        });
        break;

      case "delivery":
        subject = "Order Delivered! — #COD-2026-98412";
        html = orderDeliveryTemplate({
          orderNumber: "COD-2026-98412",
          customerName: "Alex Morgan",
          status: "delivered",
          trackingNumber: "TRK-984127392-IN",
          carrier: "DHL Express",
        });
        break;

      case "contact":
        subject = "New Contact Inquiry from Storefront";
        html = contactFormTemplate({
          name: "Sophia Martinez",
          email: to,
          subject: "Bulk Order & Wholesale Inquiry",
          message:
            "Hello E-shop Support team,\n\nI am interested in placing a bulk order for 50+ pairs of shoes for a corporate event. Could you please provide wholesale catalog pricing and shipping timelines?\n\nBest regards,\nSophia",
        });
        break;

      default:
        subject = "E-shop SMTP Connection Test";
        html = emailTemplate(
          "SMTP Connection Test Successful! 🚀",
          "<p>Your E-shop email subsystem is fully operational. Transactional emails (Order Booking, Cancellation, Delivery, Contact) are ready to send.</p>",
          { label: "Return to Admin Settings", url: "http://localhost:3000/admin/settings" }
        );
        break;
    }

    const result = await sendEmail(to, subject, html, forceTest);
    return NextResponse.json({ ...result, templateType, sentTo: to });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}

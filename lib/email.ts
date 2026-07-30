import nodemailer from "nodemailer";
import { getDb } from "@/lib/db";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  secure: boolean;
  isTestAccount?: boolean;
}

export async function getSmtpConfig(): Promise<SmtpConfig | null> {
  try {
    const db = getDb();
    const rows = (await db.execute("SELECT key,value FROM settings WHERE group_name='smtp'")).rows as { key: string; value: string }[];
    const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
    if (!map.smtp_host || !map.smtp_user) return null;
    return {
      host: map.smtp_host,
      port: parseInt(map.smtp_port || "587"),
      user: map.smtp_user,
      pass: map.smtp_pass || "",
      fromName: map.smtp_from_name || "E-shop",
      fromEmail: map.smtp_from_email || map.smtp_user,
      secure: map.smtp_secure === "true",
      isTestAccount: false,
    };
  } catch {
    return null;
  }
}

export async function getOrTestTransport(forceTest = false) {
  let cfg = await getSmtpConfig();

  if (!cfg || forceTest || cfg.host === "ethereal" || cfg.host === "test") {
    // Generate a free Ethereal test SMTP account automatically
    const testAccount = await nodemailer.createTestAccount();
    cfg = {
      host: "smtp.ethereal.email",
      port: 587,
      user: testAccount.user,
      pass: testAccount.pass,
      fromName: "E-shop (Test Server)",
      fromEmail: testAccount.user,
      secure: false,
      isTestAccount: true,
    };
  }

  const transport = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });

  return { transport, cfg };
}

export async function sendEmail(to: string, subject: string, html: string, forceTest = false) {
  try {
    const { transport, cfg } = await getOrTestTransport(forceTest);
    const info = await transport.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to,
      subject,
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || null;

    return {
      ok: true,
      messageId: info.messageId,
      previewUrl: previewUrl ? String(previewUrl) : null,
      isTestAccount: cfg.isTestAccount ?? false,
    };
  } catch (e) {
    return { ok: false, error: String(e), previewUrl: null };
  }
}

/** Branded email shell */
export function emailTemplate(heading: string, body: string, cta?: { label: string; url: string }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" maxWidth="600" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #e4e4e7;">
          <!-- Header -->
          <tr>
            <td style="background-color:#09090b;padding:24px 32px;text-align:left;">
              <table cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                <tr>
                  <td style="vertical-align:middle;">
                    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}" target="_blank" style="text-decoration:none;display:inline-block;">
                      <img src="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/Logo/Eshop.png" alt="E-shop Logo" height="36" style="height:36px;max-height:42px;width:auto;display:inline-block;vertical-align:middle;border:0;outline:none;" />
                    </a>
                  </td>
                  <td style="vertical-align:middle;text-align:right;">
                    <span style="color:#e02020;font-size:11px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">WEAR THE WORLD</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px 32px;color:#27272a;">
              <h1 style="margin:0 0 20px 0;font-size:22px;font-weight:800;color:#09090b;letter-spacing:-0.3px;">${heading}</h1>
              <div style="font-size:15px;line-height:1.6;color:#52525b;">${body}</div>
              ${
                cta
                  ? `<div style="margin-top:32px;">
                      <a href="${cta.url}" target="_blank" style="display:inline-block;background-color:#e02020;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:999px;box-shadow:0 4px 12px rgba(224,32,32,0.25);">${cta.label}</a>
                    </div>`
                  : ""
              }
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;padding:24px 32px;border-top:1px solid #f4f4f5;text-align:center;">
              <p style="margin:0 0 6px 0;font-size:12px;font-weight:600;color:#71717a;">E-shop Global Marketplace</p>
              <p style="margin:0;font-size:11px;color:#a1a1aa;">© ${new Date().getFullYear()} E-shop · All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** 1. Order Booking (Confirmation) Template */
export function orderBookingTemplate(order: {
  orderNumber: string;
  customerName: string;
  total: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  shippingAddress?: string;
}) {
  const itemListHtml = (order.items || [])
    .map(
      item => `
      <tr style="border-bottom:1px solid #f4f4f5;">
        <td style="padding:12px 0;font-size:14px;color:#09090b;font-weight:600;">${item.name}</td>
        <td style="padding:12px 0;font-size:14px;color:#71717a;text-align:center;">x${item.quantity}</td>
        <td style="padding:12px 0;font-size:14px;color:#09090b;font-weight:700;text-align:right;">€${(item.price * item.quantity).toFixed(2)}</td>
      </tr>`
    )
    .join("");

  const body = `
    <p>Hi <strong>${order.customerName}</strong>,</p>
    <p>Thank you for your order! We've received your booking and our fulfillment team is preparing it for shipment.</p>
    
    <div style="background-color:#f4f4f5;border-radius:12px;padding:20px;margin:24px 0;">
      <div style="font-size:12px;color:#71717a;text-transform:uppercase;font-weight:700;letter-spacing:1px;margin-bottom:4px;">Order Number</div>
      <div style="font-size:18px;font-weight:800;color:#e02020;">#${order.orderNumber}</div>
    </div>

    <h3 style="font-size:15px;font-weight:700;color:#09090b;margin:24px 0 12px 0;">Order Summary</h3>
    <table width="100%" cellpadding="0" cellspacing="0">
      ${itemListHtml}
      <tr>
        <td colspan="2" style="padding:16px 0 0 0;font-size:16px;font-weight:800;color:#09090b;">Total Paid</td>
        <td style="padding:16px 0 0 0;font-size:18px;font-weight:900;color:#e02020;text-align:right;">€${order.total.toFixed(2)}</td>
      </tr>
    </table>

    ${
      order.shippingAddress
        ? `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #f4f4f5;">
            <div style="font-size:12px;color:#71717a;text-transform:uppercase;font-weight:700;letter-spacing:1px;margin-bottom:6px;">Shipping Address</div>
            <div style="font-size:14px;color:#3f3f46;line-height:1.5;">${order.shippingAddress}</div>
          </div>`
        : ""
    }
  `;

  return emailTemplate(`Order Confirmed! #${order.orderNumber}`, body, {
    label: "Track Your Order",
    url: `http://localhost:3000/track?order=${order.orderNumber}`,
  });
}

/** 2. Order Cancellation Template */
export function orderCancellationTemplate(order: {
  orderNumber: string;
  customerName: string;
  reason?: string;
  refundAmount?: number;
}) {
  const body = `
    <p>Hi <strong>${order.customerName}</strong>,</p>
    <p>Your order <strong>#${order.orderNumber}</strong> has been cancelled as requested.</p>
    
    <div style="background-color:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:20px;margin:24px 0;color:#991b1b;">
      <div style="font-size:14px;font-weight:700;margin-bottom:4px;">Cancellation Details</div>
      <div style="font-size:13px;line-height:1.5;">${order.reason || "The order was cancelled by request."}</div>
      ${
        order.refundAmount
          ? `<div style="margin-top:12px;font-size:14px;font-weight:800;color:#991b1b;">Refund Amount: €${order.refundAmount.toFixed(2)} (Processing via original payment method)</div>`
          : ""
      }
    </div>

    <p style="font-size:14px;color:#52525b;">If you believe this was done in error or need assistance, please feel free to reply directly to this email or visit our store.</p>
  `;

  return emailTemplate(`Order Cancelled: #${order.orderNumber}`, body, {
    label: "Visit Store",
    url: "http://localhost:3000",
  });
}

/** 3. Order Delivery / Shipping Template */
export function orderDeliveryTemplate(order: {
  orderNumber: string;
  customerName: string;
  status: "shipped" | "delivered";
  trackingNumber?: string;
  carrier?: string;
}) {
  const isDelivered = order.status === "delivered";
  const title = isDelivered ? `Order Delivered! #${order.orderNumber}` : `Your Order is On Its Way! #${order.orderNumber}`;

  const body = `
    <p>Hi <strong>${order.customerName}</strong>,</p>
    <p>${
      isDelivered
        ? `Great news! Your package for order <strong>#${order.orderNumber}</strong> has been successfully delivered.`
        : `Exciting news! Your order <strong>#${order.orderNumber}</strong> has been dispatched and is on its way to your delivery address.`
    }</p>
    
    <div style="background-color:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin:24px 0;color:#166534;">
      <div style="font-size:12px;text-transform:uppercase;font-weight:700;letter-spacing:1px;margin-bottom:4px;">Shipment Status</div>
      <div style="font-size:18px;font-weight:800;">${isDelivered ? "DELIVERED 📦" : "IN TRANSIT 🚚"}</div>
      ${order.trackingNumber ? `<div style="margin-top:8px;font-size:13px;">Tracking Number: <strong>${order.trackingNumber}</strong> (${order.carrier || "Express Delivery"})</div>` : ""}
    </div>

    <p style="font-size:14px;color:#52525b;">Thank you for shopping with E-shop!</p>
  `;

  return emailTemplate(title, body, {
    label: "Track Shipment",
    url: `http://localhost:3000/track?order=${order.orderNumber}`,
  });
}

/** 4. Contact Form Template */
export function contactFormTemplate(contact: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}) {
  const body = `
    <p>You have received a new contact inquiry from the E-shop storefront:</p>

    <div style="background-color:#f4f4f5;border-radius:12px;padding:20px;margin:24px 0;">
      <div style="margin-bottom:12px;">
        <span style="font-size:12px;color:#71717a;text-transform:uppercase;font-weight:700;">Sender Name:</span>
        <div style="font-size:15px;font-weight:700;color:#09090b;">${contact.name}</div>
      </div>
      <div style="margin-bottom:12px;">
        <span style="font-size:12px;color:#71717a;text-transform:uppercase;font-weight:700;">Email Address:</span>
        <div style="font-size:15px;font-weight:700;color:#e02020;"><a href="mailto:${contact.email}" style="color:#e02020;">${contact.email}</a></div>
      </div>
      <div>
        <span style="font-size:12px;color:#71717a;text-transform:uppercase;font-weight:700;">Message Content:</span>
        <div style="font-size:14px;color:#27272a;margin-top:4px;white-space:pre-line;line-height:1.5;">${contact.message}</div>
      </div>
    </div>
  `;

  return emailTemplate(`New Contact Message: ${contact.subject || "Store Inquiry"}`, body);
}

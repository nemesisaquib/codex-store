import nodemailer from "nodemailer";
import { getDb } from "@/lib/db";

interface SmtpConfig {
  host: string; port: number; user: string; pass: string;
  fromName: string; fromEmail: string; secure: boolean;
}

export function getSmtpConfig(): SmtpConfig | null {
  const db = getDb();
  const rows = db.prepare("SELECT key,value FROM settings WHERE group_name='smtp'").all() as {key:string;value:string}[];
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]));
  if (!map.smtp_host || !map.smtp_user) return null;
  return {
    host: map.smtp_host,
    port: parseInt(map.smtp_port || "587"),
    user: map.smtp_user,
    pass: map.smtp_pass || "",
    fromName: map.smtp_from_name || "CODEX",
    fromEmail: map.smtp_from_email || map.smtp_user,
    secure: map.smtp_secure === "true",
  };
}

export function buildTransport(cfg: SmtpConfig) {
  return nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,           // true = 465, false = STARTTLS on 587
    auth: { user: cfg.user, pass: cfg.pass },
  });
}

export async function sendEmail(to: string, subject: string, html: string) {
  const cfg = getSmtpConfig();
  if (!cfg) return { ok: false, error: "SMTP not configured" };
  try {
    const transport = buildTransport(cfg);
    const info = await transport.sendMail({
      from: `"${cfg.fromName}" <${cfg.fromEmail}>`,
      to, subject, html,
    });
    return { ok: true, messageId: info.messageId };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** Branded email shell */
export function emailTemplate(heading: string, body: string, cta?: { label: string; url: string }) {
  return `<!DOCTYPE html><html><body style="margin:0;background:#fafafa;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:32px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.06)">
        <tr><td style="background:#0a0a0a;padding:24px 32px">
          <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-.5px">CODEX</span>
          <span style="color:#e02020;font-size:11px;font-weight:700;letter-spacing:2px;margin-left:8px">WEAR THE WORLD</span>
        </td></tr>
        <tr><td style="padding:40px 32px">
          <h1 style="margin:0 0 16px;font-size:24px;color:#171717">${heading}</h1>
          <div style="font-size:15px;line-height:1.6;color:#525252">${body}</div>
          ${cta ? `<a href="${cta.url}" style="display:inline-block;margin-top:24px;background:#e02020;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 28px;border-radius:999px">${cta.label}</a>` : ""}
        </td></tr>
        <tr><td style="background:#fafafa;padding:24px 32px;border-top:1px solid #e5e5e5">
          <p style="margin:0;font-size:12px;color:#a3a3a3">© ${new Date().getFullYear()} CODEX · Design &amp; Development by Aquib</p>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

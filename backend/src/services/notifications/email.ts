import nodemailer from "nodemailer";
import { env } from "../../config/env.js";
import { escapeHtml } from "../../lib/escape.js";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    if (!env.SMTP.HOST) return null;
    transporter = nodemailer.createTransport({
      host: env.SMTP.HOST,
      port: env.SMTP.PORT,
      secure: env.SMTP.PORT === 465,
      auth: { user: env.SMTP.USER, pass: env.SMTP.PASS },
    });
  }
  return transporter;
}

export async function sendEmail(payload: {
  to: string;
  subject: string;
  html: string;
}) {
  const t = getTransporter();

  if (t) {
    await t.sendMail({
      from: env.ALERT_FROM_EMAIL,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
  } else {
    console.log(`[Email] SMTP not configured. Would send: "${payload.subject}" to ${payload.to}`);
  }
}

export function buildDownEmail(monitorName: string, monitorUrl: string) {
  const safeName = escapeHtml(monitorName);
  const safeUrl = escapeHtml(monitorUrl);
  const subject = `DeployPulse Alert: ${monitorName} is DOWN`;
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Monitor Down</h2>
      <p><strong>${safeName}</strong> is not responding.</p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600;">URL</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${safeUrl}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600;">Time</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${new Date().toLocaleString()}</td>
        </tr>
      </table>
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        You'll receive another notification when the service recovers.
      </p>
    </div>
  `;
  return { subject, html };
}

export function buildRecoveryEmail(monitorName: string) {
  const safeName = escapeHtml(monitorName);
  const subject = `DeployPulse: ${monitorName} has recovered`;
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Service Recovered</h2>
      <p><strong>${safeName}</strong> is back online.</p>
      <p style="color: #6b7280; font-size: 14px;">Time: ${new Date().toLocaleString()}</p>
    </div>
  `;
  return { subject, html };
}

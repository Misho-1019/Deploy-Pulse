import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    if (!env.SMTP.HOST) {
      return null;
    }
    transporter = nodemailer.createTransport({
      host: env.SMTP.HOST,
      port: env.SMTP.PORT,
      secure: env.SMTP.PORT === 465,
      auth: {
        user: env.SMTP.USER,
        pass: env.SMTP.PASS,
      },
    });
  }
  return transporter;
}

export async function sendDownAlert(
  monitorId: string,
  monitorName: string,
  monitorUrl: string
) {
  // Get the user who owns this monitor
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
    include: { user: { select: { email: true } } },
  });

  if (!monitor) return;

  const subject = `DeployPulse Alert: ${monitorName} is DOWN`;
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Monitor Down</h2>
      <p><strong>${monitorName}</strong> is not responding.</p>
      <table style="border-collapse: collapse; width: 100%;">
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb; background: #f9fafb; font-weight: 600;">URL</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${monitorUrl}</td>
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

  const t = getTransporter();

  if (t) {
    try {
      await t.sendMail({
        from: env.ALERT_FROM_EMAIL,
        to: monitor.user.email,
        subject,
        html,
      });
    } catch (err) {
      console.error("[Alert] Failed to send email:", err);
    }
  } else {
    console.log(`[Alert] SMTP not configured. Would send: "${subject}" to ${monitor.user.email}`);
  }

  // Record the alert
  await prisma.alert.create({
    data: {
      monitorId,
      type: "DOWN",
      message: subject,
    },
  });
}

export async function sendRecoveryAlert(monitorId: string, monitorName: string) {
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
    include: { user: { select: { email: true } } },
  });

  if (!monitor) return;

  const subject = `DeployPulse: ${monitorName} has recovered`;
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #16a34a;">Service Recovered</h2>
      <p><strong>${monitorName}</strong> is back online.</p>
      <p style="color: #6b7280; font-size: 14px;">
        Time: ${new Date().toLocaleString()}
      </p>
    </div>
  `;

  const t = getTransporter();

  if (t) {
    try {
      await t.sendMail({
        from: env.ALERT_FROM_EMAIL,
        to: monitor.user.email,
        subject,
        html,
      });
    } catch (err) {
      console.error("[Alert] Failed to send email:", err);
    }
  } else {
    console.log(`[Alert] SMTP not configured. Would send: "${subject}" to ${monitor.user.email}`);
  }

  await prisma.alert.create({
    data: {
      monitorId,
      type: "RECOVERY",
      message: subject,
    },
  });
}

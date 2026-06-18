import { prisma } from "../lib/prisma.js";
import { sendEmail, buildDownEmail, buildRecoveryEmail } from "./notifications/email.js";
import { sendSlack } from "./notifications/slack.js";
import type { NotificationChannel } from "../generated/prisma/client.js";

export async function dispatchDownAlert(monitorId: string) {
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
    select: {
      name: true,
      url: true,
      channels: true,
      user: { select: { email: true, slackWebhookUrl: true } },
    },
  });

  if (!monitor) return;

  const channels = monitor.channels as NotificationChannel[];
  const email = buildDownEmail(monitor.name, monitor.url);

  for (const channel of channels) {
    if (channel === "EMAIL") {
      await sendEmail({ to: monitor.user.email, ...email });
      console.log(`[Alert] Email sent to ${monitor.user.email}`);
    }

    if (channel === "SLACK" && monitor.user.slackWebhookUrl) {
      await sendSlack({
        webhookUrl: monitor.user.slackWebhookUrl,
        monitorName: monitor.name,
        monitorUrl: monitor.url,
        isDown: true,
      });
      console.log(`[Alert] Slack sent for ${monitor.name}`);
    }
  }

  // Record the alert
  await prisma.alert.create({
    data: {
      monitorId,
      type: "DOWN",
      message: email.subject,
    },
  });
}

export async function dispatchRecoveryAlert(monitorId: string) {
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
    select: {
      name: true,
      url: true,
      channels: true,
      user: { select: { email: true, slackWebhookUrl: true } },
    },
  });

  if (!monitor) return;

  const channels = monitor.channels as NotificationChannel[];
  const email = buildRecoveryEmail(monitor.name);

  for (const channel of channels) {
    if (channel === "EMAIL") {
      await sendEmail({ to: monitor.user.email, ...email });
      console.log(`[Alert] Recovery email sent to ${monitor.user.email}`);
    }

    if (channel === "SLACK" && monitor.user.slackWebhookUrl) {
      await sendSlack({
        webhookUrl: monitor.user.slackWebhookUrl,
        monitorName: monitor.name,
        monitorUrl: monitor.url,
        isDown: false,
      });
      console.log(`[Alert] Recovery Slack sent for ${monitor.name}`);
    }
  }

  await prisma.alert.create({
    data: {
      monitorId,
      type: "RECOVERY",
      message: email.subject,
    },
  });
}

export async function sendTestAlert(monitorId: string, monitorName: string, monitorUrl: string) {
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
    select: {
      user: { select: { email: true, slackWebhookUrl: true } },
    },
  });

  if (!monitor) return;

  const testName = `${monitorName} (Test Alert)`;
  const email = buildDownEmail(testName, monitorUrl);

  await sendEmail({ to: monitor.user.email, ...email });
  console.log(`[Alert] Test email sent to ${monitor.user.email}`);

  if (monitor.user.slackWebhookUrl) {
    await sendSlack({
      webhookUrl: monitor.user.slackWebhookUrl,
      monitorName: testName,
      monitorUrl,
      isDown: true,
    });
    console.log(`[Alert] Test Slack sent for ${monitorName}`);
  }
}

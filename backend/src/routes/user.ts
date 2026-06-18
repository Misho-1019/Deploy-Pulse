import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { sendTestAlert } from "../services/alert.js";

const router = Router();

router.use(authenticate);

router.get("/settings", async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        name: true,
        slackWebhookUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const monitorCount = await prisma.monitor.count({
      where: { userId: req.userId },
    });

    res.json({ ...user, monitorCount, slackConfigured: !!user.slackWebhookUrl });
  } catch (err) {
    next(err);
  }
});

router.put("/slack-config", async (req: AuthRequest, res, next) => {
  try {
    const { webhookUrl } = req.body;

    if (!webhookUrl || typeof webhookUrl !== "string" || webhookUrl.length > 500) {
      res.status(400).json({ error: "webhookUrl is required and must be 500 characters or less" });
      return;
    }

    if (!webhookUrl.startsWith("https://hooks.slack.com/services/")) {
      res.status(400).json({ error: "Invalid Slack webhook URL" });
      return;
    }

    await prisma.user.update({
      where: { id: req.userId },
      data: { slackWebhookUrl: webhookUrl.trim() },
    });

    res.json({ message: "Slack webhook saved" });
  } catch (err) {
    next(err);
  }
});

router.delete("/slack-config", async (req: AuthRequest, res, next) => {
  try {
    await prisma.user.update({
      where: { id: req.userId },
      data: { slackWebhookUrl: null },
    });
    res.json({ message: "Slack webhook removed" });
  } catch (err) {
    next(err);
  }
});

router.post("/test-alert", async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true, slackWebhookUrl: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const monitor = await prisma.monitor.findFirst({
      where: { userId: req.userId },
      select: { id: true, name: true, url: true },
    });

    if (!monitor) {
      res.status(400).json({ error: "Create a monitor first to test alerts" });
      return;
    }

    await sendTestAlert(monitor.id, monitor.name, monitor.url);

    const channels: string[] = ["email"];
    if (user.slackWebhookUrl) channels.push("slack");

    res.json({
      message: `Test alert sent via: ${channels.join(", ")}`,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

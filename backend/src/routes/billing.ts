import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import {
  createCheckoutSession,
  createPortalSession,
} from "../services/billing.js";
import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import { getPlanLimits } from "../middleware/planLimits.js";

const router = Router();

router.use(authenticate);

router.post("/checkout", async (req: AuthRequest, res, next) => {
  try {
    const { priceId } = req.body;

    if (!priceId) {
      res.status(400).json({ error: "priceId is required" });
      return;
    }

    const url = await createCheckoutSession(req.userId!, priceId);
    res.json({ url });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.get("/portal", async (req: AuthRequest, res, next) => {
  try {
    const url = await createPortalSession(req.userId!);
    res.json({ url });
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.get("/status", async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { plan: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const monitorCount = await prisma.monitor.count({
      where: { userId: req.userId },
    });

    const limits = getPlanLimits(user.plan);

    res.json({
      plan: user.plan,
      monitorCount,
      maxMonitors: limits.maxMonitors,
      minInterval: limits.minInterval,
      historyDays: limits.historyDays,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

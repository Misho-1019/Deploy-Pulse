import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import {
  getMonitors,
  getMonitor,
  updateMonitor,
  deleteMonitor,
  getUptimeStats,
  getResponseTimeData,
  getIncidents,
  toggleChannel,
} from "../services/monitor.js";
import { AppError } from "../lib/errors.js";
import { prisma } from "../lib/prisma.js";
import {
  canCreateMonitor,
  validateIntervalForPlan,
} from "../middleware/planLimits.js";

const router = Router();

router.use(authenticate);

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const { name, url, mode, interval } = req.body;

    if (!name || !url || !mode) {
      res.status(400).json({ error: "name, url, and mode are required" });
      return;
    }

    if (typeof name !== "string" || name.trim().length === 0 || name.length > 255) {
      res.status(400).json({ error: "Name must be between 1-255 characters" });
      return;
    }

    if (typeof url !== "string" || url.length > 2048) {
      res.status(400).json({ error: "URL must be 2048 characters or less" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { plan: true },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const checkInterval = interval || 300;
    const intervalCheck = validateIntervalForPlan(user.plan, checkInterval);
    if (!intervalCheck.allowed) {
      res.status(403).json({ error: intervalCheck.message });
      return;
    }

    // Atomic: count + create in transaction to prevent race condition
    const monitor = await prisma.$transaction(async (tx) => {
      const currentCount = await tx.monitor.count({
        where: { userId: req.userId! },
      });

      const countCheck = canCreateMonitor(user.plan, currentCount);
      if (!countCheck.allowed) {
        throw new AppError(countCheck.message!, 403);
      }

      return tx.monitor.create({
        data: {
          name: name.trim(),
          url: url.trim(),
          mode,
          interval: checkInterval,
          userId: req.userId!,
        },
      });
    });

    res.status(201).json(monitor);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const monitors = await getMonitors(req.userId!);
    res.json(monitors);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const id = String(req.params.id);
    const monitor = await getMonitor(id, req.userId!);
    res.json(monitor);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.put("/:id", async (req: AuthRequest, res, next) => {
  try {
    const { name, url, mode, interval } = req.body;

    if (interval !== undefined) {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { plan: true },
      });
      if (user) {
        const intervalCheck = validateIntervalForPlan(user.plan, interval);
        if (!intervalCheck.allowed) {
          res.status(403).json({ error: intervalCheck.message });
          return;
        }
      }
    }

    const id = String(req.params.id);
    const monitor = await updateMonitor(id, req.userId!, {
      name,
      url,
      mode,
      interval,
    });

    res.json(monitor);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const id = String(req.params.id);
    await deleteMonitor(id, req.userId!);
    res.status(204).send();
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.get("/:id/uptime", async (req: AuthRequest, res, next) => {
  try {
    const stats = await getUptimeStats(String(req.params.id), req.userId!);
    res.json(stats);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.get("/:id/response-times", async (req: AuthRequest, res, next) => {
  try {
    const period =
      typeof req.query.period === "string" ? req.query.period : "day";
    const data = await getResponseTimeData(
      String(req.params.id),
      req.userId!,
      period
    );
    res.json(data);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.get("/:id/incidents", async (req: AuthRequest, res, next) => {
  try {
    const incidents = await getIncidents(String(req.params.id), req.userId!);
    res.json(incidents);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.put("/:id/channels/toggle", async (req: AuthRequest, res, next) => {
  try {
    const { channel } = req.body;
    if (!channel) {
      res.status(400).json({ error: "channel is required (EMAIL or SLACK)" });
      return;
    }
    const monitor = await toggleChannel(
      String(req.params.id),
      req.userId!,
      String(channel)
    );
    res.json(monitor);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
});

export default router;

import { Router } from "express";
import { authenticate, type AuthRequest } from "../middleware/auth.js";
import {
  createMonitor,
  getMonitors,
  getMonitor,
  updateMonitor,
  deleteMonitor,
  getUptimeStats,
  getResponseTimeData,
  AppError,
} from "../services/monitor.js";

const router = Router();

router.use(authenticate);

router.post("/", async (req: AuthRequest, res, next) => {
  try {
    const { name, url, mode, interval } = req.body;

    if (!name || !url || !mode) {
      res.status(400).json({ error: "name, url, and mode are required" });
      return;
    }

    const monitor = await createMonitor(req.userId!, {
      name,
      url,
      mode,
      interval,
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

export default router;

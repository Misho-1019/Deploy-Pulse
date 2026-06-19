import { Router } from "express";
import rateLimit from "express-rate-limit";
import { register, login } from "../services/auth.js";
import { AppError } from "../lib/errors.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again later." },
});

router.post("/register", authLimiter, async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    if (typeof email !== "string" || email.length > 255) {
      res.status(400).json({ error: "Invalid email" });
      return;
    }

    if (typeof password !== "string" || password.length < 6 || password.length > 128) {
      res.status(400).json({ error: "Password must be 6-128 characters" });
      return;
    }

    if (name && (typeof name !== "string" || name.length > 100)) {
      res.status(400).json({ error: "Name must be 100 characters or less" });
      return;
    }

    const result = await register(email, password, name);
    res.status(201).json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.post("/login", authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    if (typeof email !== "string" || typeof password !== "string") {
      res.status(400).json({ error: "Invalid credentials" });
      return;
    }

    const result = await login(email, password);
    res.json(result);
  } catch (err) {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    next(err);
  }
});

export default router;

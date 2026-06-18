import { Router, type Request, type Response } from "express";
import { handleWebhook, AppError } from "../services/billing.js";

const router = Router();

router.post(
  "/stripe",
  async (req: Request, res: Response, next) => {
    try {
      const signature = req.headers["stripe-signature"] as string;
      const rawBody = req.body as Buffer;

      await handleWebhook(rawBody, signature);
      res.json({ received: true });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ error: err.message });
        return;
      }
      // Always return 200 to Stripe to prevent retries
      res.status(200).json({ received: false });
    }
  }
);

export default router;

import Stripe from "stripe";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

const PRICE_TO_PLAN: Record<string, "STARTER" | "PRO"> = {};

if (env.STRIPE_PRICE_STARTER_ID) {
  PRICE_TO_PLAN[env.STRIPE_PRICE_STARTER_ID] = "STARTER";
}
if (env.STRIPE_PRICE_PRO_ID) {
  PRICE_TO_PLAN[env.STRIPE_PRICE_PRO_ID] = "PRO";
}

export async function createCheckoutSession(
  userId: string,
  priceId: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, stripeCustomerId: true },
  });

  if (!user) throw new AppError("User not found", 404);

  const plan = PRICE_TO_PLAN[priceId];
  if (!plan) throw new AppError("Invalid price ID", 400);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: user.stripeCustomerId ?? undefined,
    customer_email: user.stripeCustomerId ? undefined : user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.FRONTEND_URL}/app/settings?checkout=success`,
    cancel_url: `${env.FRONTEND_URL}/app/settings?checkout=cancelled`,
    metadata: { userId, plan },
  });

  return session.url!;
}

export async function createPortalSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    throw new AppError("No Stripe customer found", 400);
  }

  const portal = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${env.FRONTEND_URL}/app/settings`,
  });

  return portal.url;
}

export async function handleWebhook(
  rawBody: Buffer,
  signature: string
): Promise<{ received: boolean }> {
  const whsec = env.STRIPE_WEBHOOK_SECRET;

  if (!whsec) {
    console.log("[Stripe] Webhook received but STRIPE_WEBHOOK_SECRET not set");
    return { received: true };
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, whsec);
  } catch (err) {
    console.error("[Stripe] Invalid signature:", err);
    throw new AppError("Invalid webhook signature", 400);
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(sub);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(sub);
      break;
    }
  }

  return { received: true };
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan as "STARTER" | "PRO" | undefined;

  if (!userId || !plan) return;

  const customerId =
    typeof session.customer === "string" ? session.customer : session.customer?.id;

  if (!customerId) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      plan,
      stripeCustomerId: customerId,
      stripeSubscriptionId: session.subscription as string,
    },
  });

  console.log(`[Stripe] User ${userId} upgraded to ${plan}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  if (subscription.status === "active" || subscription.status === "trialing") {
    const user = await prisma.user.findFirst({
      where: { stripeSubscriptionId: subscription.id },
      select: { id: true },
    });

    if (!user) return;

    const priceId = subscription.items.data[0]?.price.id;
    const plan = PRICE_TO_PLAN[priceId] || "FREE";

    await prisma.user.update({
      where: { id: user.id },
      data: { plan: plan as "FREE" | "STARTER" | "PRO" },
    });

    console.log(`[Stripe] Subscription updated for user ${user.id}: ${plan}`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const user = await prisma.user.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    select: { id: true },
  });

  if (!user) return;

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "FREE", stripeSubscriptionId: null },
  });

  console.log(`[Stripe] Subscription cancelled for user ${user.id} → FREE`);
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

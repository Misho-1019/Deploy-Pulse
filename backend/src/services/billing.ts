import Stripe from "stripe";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";
import { sendEmail } from "./notifications/email.js";
import { sendSlack } from "./notifications/slack.js";

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

  await notifyPlanChange(userId, plan, "upgrade");
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  if (subscription.status === "active" || subscription.status === "trialing") {
    const user = await prisma.user.findUnique({
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

  await notifyPlanChange(user.id, "FREE", "downgrade");
}

async function notifyPlanChange(
  userId: string,
  plan: "STARTER" | "PRO" | "FREE",
  event: "upgrade" | "downgrade"
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, slackWebhookUrl: true },
  });

  if (!user) return;

  const name = user.name || user.email.split("@")[0];

  if (event === "upgrade") {
    const isPro = plan === "PRO";
    const emoji = isPro ? "\u{1F680}" : "\u{1F389}";
    const headerText = isPro ? "Welcome to Pro!" : "Welcome to Starter!";
    const subtitle = isPro
      ? "You're on the Pro plan — the full DeployPulse experience."
      : "You just unlocked the Starter plan — your apps are in great hands.";

    const features = isPro
      ? [
          { label: "100 monitors", emoji: "\u{1F4E1}" },
          { label: "1-minute checks", emoji: "\u26A1" },
          { label: "Slack + Email alerts", emoji: "\u{1F4AC}" },
          { label: "90-day history", emoji: "\u{1F4CA}" },
          { label: "Advanced analytics", emoji: "\u{1F4C8}" },
        ]
      : [
          { label: "25 monitors (was 3)", emoji: "\u{1F4E1}" },
          { label: "5-minute checks (was 10 min)", emoji: "\u26A1" },
          { label: "Email alerts on downtime", emoji: "\u{1F4E7}" },
          { label: "30-day history (was 7 days)", emoji: "\u{1F4CA}" },
          { label: "Full Monitoring mode", emoji: "\u{1F4C8}" },
        ];

    const footer = isPro
      ? "Every minute, every monitor, every channel. Nothing slips through."
      : "You can now add up to 25 monitors, set checks as fast as 5 minutes, and get notified the moment something goes down.";

    const subject = isPro
      ? `\u{1F680} You're on Pro now, ${name}!`
      : `\u{1F389} Welcome to Starter, ${name}!`;

    const accentColor = isPro ? "#7c3aed" : "#3b82f6";
    const accentEnd = isPro ? "#a855f7" : "#6366f1";

    const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
  <div style="background: linear-gradient(135deg, ${accentColor}, ${accentEnd}); padding: 32px 24px; text-align: center;">
    <div style="font-size: 48px; margin-bottom: 8px;">${emoji}</div>
    <h1 style="color: #ffffff; font-size: 24px; font-weight: 700; margin: 0 0 8px;">${headerText}</h1>
    <p style="color: rgba(255,255,255,0.9); font-size: 15px; margin: 0;">${subtitle}</p>
  </div>

  <div style="padding: 24px;">
    <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">Hi ${name},</p>

    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <p style="font-size: 13px; font-weight: 600; color: #6b7280; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">What you got</p>
      ${features
        .map(
          (f) =>
            `<div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f3f4f6;">
              <span style="font-size: 16px;">${f.emoji}</span>
              <span style="color: #374151; font-size: 14px;">${f.label}</span>
            </div>`
        )
        .join("")}
    </div>

    <p style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">${footer}</p>

    <a href="${env.FRONTEND_URL}/app" style="display: block; width: 100%; background: ${accentColor}; color: #ffffff; text-align: center; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; box-sizing: border-box;">
      Go to Dashboard
    </a>

    <p style="color: #9ca3af; font-size: 13px; margin: 16px 0 0; text-align: center;">
      Thank you for upgrading! If you have any questions, just reply.
    </p>
  </div>

  <div style="border-top: 1px solid #e5e7eb; padding: 16px 24px; text-align: center;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">DeployPulse &mdash; Keep your apps alive.</p>
  </div>
</div>`;

    await sendEmail({ to: user.email, subject, html });
    console.log(`[Plan] Upgrade email sent to ${user.email}`);

    if (user.slackWebhookUrl) {
      await sendSlack({
        webhookUrl: user.slackWebhookUrl,
        monitorName: `Plan Upgraded to ${plan}`,
        monitorUrl: env.FRONTEND_URL + "/app",
        isDown: false,
      });
    }
  } else {
    const subject = "Your plan has changed to Free";

    const html = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
  <div style="background: #f3f4f6; padding: 32px 24px; text-align: center;">
    <div style="font-size: 48px; margin-bottom: 8px;">\u{1F504}</div>
    <h1 style="color: #374151; font-size: 24px; font-weight: 700; margin: 0 0 8px;">Plan Changed to Free</h1>
    <p style="color: #6b7280; font-size: 15px; margin: 0;">Your subscription has ended — you're back on the Free plan.</p>
  </div>

  <div style="padding: 24px;">
    <p style="color: #374151; font-size: 15px; margin: 0 0 16px;">Hi ${name},</p>

    <div style="background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
      <p style="font-size: 13px; font-weight: 600; color: #92400e; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">What changed</p>
      <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #fde68a;">
        <span style="font-size: 16px;">\u{1F4E1}</span>
        <span style="color: #92400e; font-size: 14px;">3 monitor limit</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #fde68a;">
        <span style="font-size: 16px;">\u26A1</span>
        <span style="color: #92400e; font-size: 14px;">10-minute minimum interval</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0; border-bottom: 1px solid #fde68a;">
        <span style="font-size: 16px;">\u{1F4CA}</span>
        <span style="color: #92400e; font-size: 14px;">7-day history</span>
      </div>
      <div style="display: flex; align-items: center; gap: 8px; padding: 6px 0;">
        <span style="font-size: 16px;">\u{1F4E7}</span>
        <span style="color: #92400e; font-size: 14px;">Email alerts only</span>
      </div>
    </div>

    <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px; margin-bottom: 20px;">
      <p style="color: #065f46; font-size: 13px; margin: 0;">
        \u{1F44D} Your existing monitors are safe. Nothing has been deleted. You just can't add more until you're within the Free limit.
      </p>
    </div>

    <a href="${env.FRONTEND_URL}/app/settings" style="display: block; width: 100%; background: #3b82f6; color: #ffffff; text-align: center; padding: 12px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; box-sizing: border-box;">
      Upgrade again
    </a>

    <p style="color: #9ca3af; font-size: 13px; margin: 16px 0 0; text-align: center;">
      Ready to come back? We'd love to have you again.
    </p>
  </div>

  <div style="border-top: 1px solid #e5e7eb; padding: 16px 24px; text-align: center;">
    <p style="color: #9ca3af; font-size: 12px; margin: 0;">DeployPulse &mdash; Keep your apps alive.</p>
  </div>
</div>`;

    await sendEmail({ to: user.email, subject, html });
    console.log(`[Plan] Downgrade email sent to ${user.email}`);

    if (user.slackWebhookUrl) {
      await sendSlack({
        webhookUrl: user.slackWebhookUrl,
        monitorName: "Plan changed to Free",
        monitorUrl: env.FRONTEND_URL + "/app/settings",
        isDown: true,
      });
    }
  }
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

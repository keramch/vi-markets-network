import express, { Router } from "express";
import Stripe from "stripe";
import { db, auth } from "../firebase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-06-24.dahlia" });

const router = Router();

const PRICE_MAP: Record<string, string | undefined> = {
  "6month":  process.env.STRIPE_PRICE_6MONTH,
  "12month": process.env.STRIPE_PRICE_12MONTH,
};

// POST /stripe/create-checkout-session
router.post("/create-checkout-session", express.json(), async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split("Bearer ")[1];

  let decoded: Awaited<ReturnType<typeof auth.verifyIdToken>>;
  try {
    decoded = await auth.verifyIdToken(token);
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }

  const { priceId, uid } = req.body as { priceId?: string; uid?: string };

  if (!priceId || !uid) {
    return res.status(400).json({ error: "priceId and uid are required" });
  }

  const stripePriceId = PRICE_MAP[priceId];
  if (!stripePriceId) {
    return res.status(400).json({ error: "Invalid priceId" });
  }

  const billingCycle = priceId === "6month" ? "6month" : "annual";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: stripePriceId, quantity: 1 }],
      currency: "cad",
      success_url: "https://vimarkets.ca/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://vimarkets.ca/dashboard?payment=cancelled",
      customer_email: decoded.email,
      metadata: { uid, billingCycle },
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout session error:", err);
    return res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// POST /stripe/webhook
// express.raw() is applied per-route so the raw body is preserved for signature verification.
// This router is mounted in index.ts BEFORE the global express.json() middleware.
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("Stripe webhook: missing signature header or STRIPE_WEBHOOK_SECRET env var");
    return res.status(400).json({ error: "Missing webhook configuration" });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return res.status(400).json({ error: "Webhook signature verification failed" });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { uid, billingCycle } = session.metadata ?? {};
    console.log("Stripe webhook session.metadata:", session.metadata);

    if (!uid || !billingCycle) {
      console.error("Stripe webhook: missing uid or billingCycle in session metadata", session.id);
      return res.sendStatus(200);
    }

    const base = new Date();
    const termDate = new Date(base);
    termDate.setMonth(termDate.getMonth() + (billingCycle === "6month" ? 6 : 12));
    const termEnds = termDate.toISOString();

    const stripeCustomerId =
      (typeof session.customer === "string" ? session.customer : null) ??
      session.customer_details?.email ??
      null;

    const stripePaymentId =
      typeof session.payment_intent === "string" ? session.payment_intent : null;

    try {
      await db.collection("users").doc(uid).set(
        {
          subscription: {
            tier: "pro",
            billingCycle,
            termEnds,
            introRate: true,
            stripeCustomerId,
            stripePaymentId,
          },
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Stripe webhook: failed to update user subscription for uid", uid, err);
      // Return 200 so Stripe does not retry — error is logged for manual recovery
    }
  }

  // checkout.session.expired — no action needed
  return res.sendStatus(200);
});

export default router;

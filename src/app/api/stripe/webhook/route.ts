import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { db } from "@/db/index";
import { bills, payments } from "@/db/schema";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured (STRIPE_SECRET_KEY missing)" },
      { status: 503 }
    );
  }

  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const billId = paymentIntent.metadata?.billId;

      if (billId) {
        // Update bill status
        await db
          .update(bills)
          .set({
            status: "paid",
            paidAt: new Date(),
            paymentIntentId: paymentIntent.id,
            updatedAt: new Date(),
          })
          .where(eq(bills.id, billId));

        // Update payment record
        await db
          .update(payments)
          .set({ status: "completed" })
          .where(eq(payments.stripePaymentId, paymentIntent.id));
      }
      break;
    }

    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;

      // Update payment record to failed
      await db
        .update(payments)
        .set({ status: "failed" })
        .where(eq(payments.stripePaymentId, paymentIntent.id));
      break;
    }
  }

  return NextResponse.json({ received: true });
}

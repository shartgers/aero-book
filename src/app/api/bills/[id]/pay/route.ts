import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { bills, payments } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-01-28.clover",
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [bill] = await db.select().from(bills).where(eq(bills.id, id));

  if (!bill) {
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }

  if (bill.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (bill.status === "paid") {
    return NextResponse.json({ error: "Bill is already paid" }, { status: 400 });
  }

  const body = await request.json();
  const { paymentMethodId } = body;

  if (!paymentMethodId) {
    return NextResponse.json({ error: "Missing required field: paymentMethodId" }, { status: 400 });
  }

  const currency = process.env.STRIPE_CURRENCY ?? "eur";
  const amountInCents = Math.round(parseFloat(bill.totalAmount) * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency,
    payment_method: paymentMethodId,
    confirm: true,
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never",
    },
    metadata: {
      billId: id,
    },
  });

  // Insert payment record
  await db.insert(payments).values({
    billId: id,
    amount: bill.totalAmount,
    paymentMethod: paymentMethodId,
    stripePaymentId: paymentIntent.id,
    status: paymentIntent.status === "succeeded" ? "completed" : "pending",
  });

  // Update bill if payment succeeded
  if (paymentIntent.status === "succeeded") {
    await db
      .update(bills)
      .set({
        status: "paid",
        paymentIntentId: paymentIntent.id,
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(bills.id, id));
  } else {
    await db
      .update(bills)
      .set({
        paymentIntentId: paymentIntent.id,
        updatedAt: new Date(),
      })
      .where(eq(bills.id, id));
  }

  return NextResponse.json({
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    clientSecret: paymentIntent.client_secret,
  });
}

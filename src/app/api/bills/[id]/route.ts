import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { bills, billDisputes, payments, notificationPreferences } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendPushNotification } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
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

  const disputes = await db
    .select()
    .from(billDisputes)
    .where(eq(billDisputes.billId, id));

  const billPayments = await db
    .select()
    .from(payments)
    .where(eq(payments.billId, id));

  // Send push notification if bill was created within last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  if (bill.createdAt > fiveMinutesAgo) {
    const [prefs] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, session.user.id));

    if (prefs?.pushEnabled && prefs?.billNotifications && prefs.pushSubscription) {
      await sendPushNotification(prefs.pushSubscription as object, {
        title: "New Bill",
        body: `You have a new bill for $${bill.totalAmount}`,
        url: `/bills/${bill.id}`,
      });
    }
  }

  return NextResponse.json({
    ...bill,
    disputes,
    payments: billPayments,
  });
}

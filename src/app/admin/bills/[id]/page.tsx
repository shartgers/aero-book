import { auth } from "@/lib/auth/server";
import { redirect, notFound } from "next/navigation";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BillSummary } from "@/components/BillSummary";
import { AdminBillControls } from "@/components/AdminBillControls";
import type { BillStatus } from "@/components/BillStatusBadge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface AdminBillDetail {
  id: string;
  aircraftHours: number;
  aircraftCost: number;
  instructorHours?: number | null;
  instructorCost?: number | null;
  landingFees?: number | null;
  surcharges?: number | null;
  totalAmount: number;
  status: BillStatus;
  createdAt: string;
  userName: string;
  aircraftTailNumber: string;
  bookingDate: string;
}

export default async function AdminBillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const [dbUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.email, session.user.email));

  if (!dbUser || dbUser.role !== "admin") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">Admin Bill Detail</h1>
        <p className="text-destructive">Access denied. You must be an admin to view this page.</p>
      </div>
    );
  }

  const { id } = await params;

  let bill: AdminBillDetail | null = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/admin/bills/${id}`, { cache: "no-store" });
    if (res.ok) {
      bill = await res.json();
    } else if (res.status === 404) {
      notFound();
    }
  } catch {
    // API may not be available yet
  }

  if (!bill) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/bills">&larr; Back to all bills</Link>
        </Button>
      </div>

      <h1 className="mb-2 text-2xl font-bold">Bill Detail (Admin)</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        User: {bill.userName} | Aircraft: {bill.aircraftTailNumber} | {new Date(bill.bookingDate).toLocaleDateString()}
      </p>

      <div className="space-y-6">
        <BillSummary bill={bill} showActions={false} />
        <AdminBillControls bill={bill} />
      </div>
    </div>
  );
}

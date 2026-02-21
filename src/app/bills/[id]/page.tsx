import { auth } from "@/lib/auth/server";
import { redirect, notFound } from "next/navigation";
import { BillSummary } from "@/components/BillSummary";
import type { BillStatus } from "@/components/BillStatusBadge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface BillDetail {
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
  aircraftTailNumber?: string;
  bookingDate?: string;
}

export default async function BillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const { id } = await params;

  let bill: BillDetail | null = null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/bills/${id}`, { cache: "no-store" });
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/bills">&larr; Back to bills</Link>
        </Button>
      </div>

      <h1 className="mb-2 text-2xl font-bold">Bill Details</h1>
      {bill.aircraftTailNumber && (
        <p className="text-muted-foreground mb-6 text-sm">
          Aircraft: {bill.aircraftTailNumber}
          {bill.bookingDate && ` | ${new Date(bill.bookingDate).toLocaleDateString()}`}
        </p>
      )}

      <BillSummary bill={bill} showActions={true} />
    </div>
  );
}

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { BillSummary } from "@/components/BillSummary";
import type { BillStatus } from "@/components/BillStatusBadge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

interface Bill {
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
}

export default async function BillsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  let bills: Bill[] = [];
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/bills`, {
      cache: "no-store",
      headers: { cookie: "" }, // session handled by proxy in real usage
    });
    if (res.ok) {
      bills = await res.json();
    }
  } catch {
    // API may not be available yet
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">&larr; Back to dashboard</Link>
        </Button>
      </div>

      <h1 className="mb-6 text-2xl font-bold">My Bills</h1>

      {bills.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No bills yet.</p>
      ) : (
        <div className="space-y-6">
          {bills.map((bill) => (
            <Link key={bill.id} href={`/bills/${bill.id}`} className="block">
              <BillSummary bill={bill} showActions={false} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

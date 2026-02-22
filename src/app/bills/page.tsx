import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { BillSummary } from "@/components/BillSummary";
import type { BillStatus } from "@/components/BillStatusBadge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getBillsForUser } from "@/lib/bills-data";

export const dynamic = "force-dynamic";

/** Bill shape from getBillsForUser; numeric columns come from DB as strings. */
interface Bill {
  id: string;
  aircraftHours: number | string;
  aircraftCost: number | string;
  instructorHours?: number | string | null;
  instructorCost?: number | string | null;
  landingFees?: number | string | null;
  surcharges?: number | string | null;
  totalAmount: number | string;
  status: BillStatus;
  createdAt: string | Date;
}

export default async function BillsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  // Use shared data layer in same request context so auth session is valid (no internal fetch 401s).
  const bills: Bill[] = await getBillsForUser(session.user);

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

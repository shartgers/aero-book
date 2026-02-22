import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { users, bills, bookings, aircraft } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { BillStatusBadge, type BillStatus } from "@/components/BillStatusBadge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface AdminBill {
  id: string;
  userName: string;
  aircraftTailNumber: string;
  bookingDate: string;
  totalAmount: number;
  status: BillStatus;
  createdAt: string;
}

export default async function AdminBillsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
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
        <h1 className="mb-4 text-2xl font-bold">Admin Billing</h1>
        <p className="text-destructive">Access denied. You must be an admin to view this page.</p>
      </div>
    );
  }

  const { status: filterStatus } = await searchParams;

  // Load bills directly in the Server Component. We do not fetch /api/admin/bills
  // from here because server-side fetch does not send the browser's cookies,
  // so the API would see an unauthenticated request and return 401.
  let query = db
    .select({
      id: bills.id,
      userName: users.name,
      aircraftTailNumber: aircraft.tailNumber,
      bookingStartTime: bookings.startTime,
      totalAmount: bills.totalAmount,
      status: bills.status,
      createdAt: bills.createdAt,
    })
    .from(bills)
    .innerJoin(bookings, eq(bookings.id, bills.bookingId))
    .innerJoin(aircraft, eq(aircraft.id, bookings.aircraftId))
    .innerJoin(users, eq(users.id, bills.userId))
    .$dynamic();

  if (filterStatus) {
    query = query.where(eq(bills.status, filterStatus as "pending" | "paid" | "disputed" | "refunded"));
  }

  const rows = await query.orderBy(desc(bills.createdAt));

  const billsList: AdminBill[] = rows.map((r) => ({
    id: r.id,
    userName: r.userName ?? "",
    aircraftTailNumber: r.aircraftTailNumber,
    bookingDate: r.bookingStartTime.toISOString(),
    totalAmount: Number(r.totalAmount),
    status: r.status as BillStatus,
    createdAt: r.createdAt.toISOString(),
  }));

  const statuses: (BillStatus | "all")[] = ["all", "pending", "paid", "disputed", "refunded"];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">&larr; Back to admin</Link>
        </Button>
      </div>

      <h1 className="mb-6 text-2xl font-bold">All Bills</h1>

      {/* Status filter tabs */}
      <div className="mb-4 flex gap-2">
        {statuses.map((s) => {
          const isActive = s === "all" ? !filterStatus : filterStatus === s;
          return (
            <Link
              key={s}
              href={s === "all" ? "/admin/bills" : `/admin/bills?status=${s}`}
              className={`rounded-full px-3 py-1 text-sm capitalize ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s}
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-4 py-2 text-left font-medium">User</th>
              <th className="px-4 py-2 text-left font-medium">Aircraft</th>
              <th className="px-4 py-2 text-left font-medium">Date</th>
              <th className="px-4 py-2 text-left font-medium">Total</th>
              <th className="px-4 py-2 text-left font-medium">Status</th>
              <th className="px-4 py-2 text-left font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {billsList.map((b) => (
              <tr key={b.id} className="border-b">
                <td className="px-4 py-2">{b.userName}</td>
                <td className="px-4 py-2">{b.aircraftTailNumber}</td>
                <td className="px-4 py-2">{new Date(b.bookingDate).toLocaleDateString()}</td>
                <td className="px-4 py-2">&euro;{b.totalAmount.toFixed(2)}</td>
                <td className="px-4 py-2"><BillStatusBadge status={b.status} /></td>
                <td className="px-4 py-2">{new Date(b.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
            {billsList.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No bills found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { UtilisationTable, type UtilisationRow } from "@/components/analytics/UtilisationTable";
import { RevenuePanel, type RevenueData } from "@/components/analytics/RevenuePanel";
import { DemandPanel, type DemandData } from "@/components/analytics/DemandPanel";
import { InstructorUtilisationTable, type InstructorRow } from "@/components/analytics/InstructorUtilisationTable";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function fetchJson<T>(url: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch {
    // API may not be available yet
  }
  return fallback;
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
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
        <h1 className="mb-4 text-2xl font-bold">Analytics</h1>
        <p className="text-destructive">Access denied. You must be an admin to view this page.</p>
      </div>
    );
  }

  const { from: fromParam, to: toParam } = await searchParams;

  // Default: last 30 days
  const now = new Date();
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const from = fromParam || defaultFrom.toISOString().split("T")[0];
  const to = toParam || now.toISOString().split("T")[0];

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const qs = `from=${from}&to=${to}`;

  const [utilisation, revenue, demand, instructors] = await Promise.all([
    fetchJson<UtilisationRow[]>(`${baseUrl}/api/analytics/utilisation?${qs}`, []),
    fetchJson<RevenueData>(`${baseUrl}/api/analytics/revenue?${qs}`, {
      totalRevenue: 0,
      paidRevenue: 0,
      pendingRevenue: 0,
      byAircraft: [],
      byMonth: [],
    }),
    fetchJson<DemandData>(`${baseUrl}/api/analytics/demand?${qs}`, {
      unfulfilledCount: 0,
      unfulfilledByReason: [],
      peakHours: [],
      topUnfulfilledSlots: [],
    }),
    fetchJson<InstructorRow[]>(`${baseUrl}/api/analytics/instructors?${qs}`, []),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">&larr; Back to admin</Link>
        </Button>
      </div>

      <h1 className="mb-6 text-2xl font-bold">Analytics Dashboard</h1>

      {/* Date range picker */}
      <form className="mb-8 flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="from" className="mb-1 block text-sm font-medium">From</label>
          <input
            id="from"
            name="from"
            type="date"
            defaultValue={from}
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
        </div>
        <div>
          <label htmlFor="to" className="mb-1 block text-sm font-medium">To</label>
          <input
            id="to"
            name="to"
            type="date"
            defaultValue={to}
            className="rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
          />
        </div>
        <Button type="submit">Apply</Button>
      </form>

      {/* Fleet Utilisation */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Fleet Utilisation</h2>
        <UtilisationTable data={utilisation} />
      </section>

      {/* Revenue */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Revenue</h2>
        <RevenuePanel data={revenue} />
      </section>

      {/* Demand Analysis */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Demand Analysis</h2>
        <DemandPanel data={demand} />
      </section>

      {/* Instructor Utilisation */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Instructor Utilisation</h2>
        <InstructorUtilisationTable data={instructors} />
      </section>
    </div>
  );
}

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { safetyReports, users } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { SafetyReviewPanel } from "@/components/SafetyReviewPanel";

export const dynamic = "force-dynamic";

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

export default async function AdminSafetyPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const role = await getUserRole(session.user.id);
  if (role !== "admin") redirect("/dashboard");

  const rows = await db
    .select({ report: safetyReports, reporterName: users.name })
    .from(safetyReports)
    .leftJoin(users, eq(safetyReports.reportedBy, users.id))
    .orderBy(desc(safetyReports.createdAt));

  const statusCounts = { submitted: 0, under_review: 0, closed: 0 };
  for (const r of rows) {
    const s = r.report.status as keyof typeof statusCounts;
    if (s in statusCounts) statusCounts[s]++;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Safety Reports</h1>

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold">{statusCounts.submitted}</p>
          <p className="text-sm text-muted-foreground">Submitted</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold">{statusCounts.under_review}</p>
          <p className="text-sm text-muted-foreground">Under Review</p>
        </div>
        <div className="rounded-lg border p-4 text-center">
          <p className="text-2xl font-bold">{statusCounts.closed}</p>
          <p className="text-sm text-muted-foreground">Closed</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground">No safety reports yet.</p>
      ) : (
        <div className="space-y-4">
          {rows.map(r => (
            <SafetyReviewPanel
              key={r.report.id}
              report={{
                id: r.report.id,
                category: r.report.category,
                severity: r.report.severity,
                description: r.report.description,
                dateOfOccurrence: r.report.dateOfOccurrence.toISOString(),
                location: r.report.location,
                status: r.report.status,
                resolution: r.report.resolution,
                isAnonymous: r.report.isAnonymous,
                reporterName: r.report.isAnonymous ? null : (r.reporterName ?? null),
                createdAt: r.report.createdAt.toISOString(),
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

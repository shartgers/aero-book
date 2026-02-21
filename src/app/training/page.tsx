export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db/index";
import { trainingRecords, users, instructors } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

export default async function TrainingPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");
  const userId = session.user.id;
  const role = await getUserRole(userId);

  let records: (typeof trainingRecords.$inferSelect & { studentName?: string | null })[];

  if (role === "admin") {
    const rows = await db
      .select({ record: trainingRecords, studentName: users.name })
      .from(trainingRecords)
      .leftJoin(users, eq(trainingRecords.studentId, users.id))
      .orderBy(desc(trainingRecords.createdAt));
    records = rows.map((r) => ({ ...r.record, studentName: r.studentName }));
  } else if (role === "instructor") {
    const [instr] = await db.select().from(instructors).where(eq(instructors.userId, userId));
    if (instr) {
      const rows = await db
        .select({ record: trainingRecords, studentName: users.name })
        .from(trainingRecords)
        .leftJoin(users, eq(trainingRecords.studentId, users.id))
        .where(eq(trainingRecords.instructorId, instr.id))
        .orderBy(desc(trainingRecords.createdAt));
      records = rows.map((r) => ({ ...r.record, studentName: r.studentName }));
    } else {
      records = [];
    }
  } else {
    const rows = await db
      .select()
      .from(trainingRecords)
      .where(eq(trainingRecords.studentId, userId))
      .orderBy(desc(trainingRecords.createdAt));
    records = rows;
  }

  const statusColors: Record<string, string> = {
    active: "text-blue-700 bg-blue-100",
    completed: "text-green-700 bg-green-100",
    suspended: "text-amber-700 bg-amber-100",
    failed: "text-red-700 bg-red-100",
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Training Progress</h1>

      {records.length === 0 ? (
        <p className="text-muted-foreground">No training records found.</p>
      ) : (
        <div className="space-y-4">
          {records.map((r) => {
            const pct = parseFloat(r.progressPercent);
            return (
              <Card key={r.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{r.courseType}</CardTitle>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[r.status] ?? "text-gray-700 bg-gray-100"}`}
                    >
                      {r.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  {"studentName" in r && r.studentName && (
                    <p className="mb-1 text-sm text-muted-foreground">
                      Student: {r.studentName}
                    </p>
                  )}
                  <p className="mb-2 text-sm text-muted-foreground">
                    Started: {new Date(r.startDate).toLocaleDateString()}
                  </p>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Progress</span>
                      <span>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-blue-600"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <Link
                    href={`/training/${r.id}`}
                    className="text-sm font-medium text-blue-600 hover:underline"
                  >
                    View Details
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}

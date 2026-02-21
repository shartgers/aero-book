export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/db/index";
import { trainingRecords, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import NewEnrolmentForm from "./NewEnrolmentForm";

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

export default async function AdminTrainingPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");
  const userId = session.user.id;

  const role = await getUserRole(userId);
  if (role !== "admin") redirect("/dashboard");

  const rows = await db
    .select({
      record: trainingRecords,
      studentName: users.name,
    })
    .from(trainingRecords)
    .leftJoin(users, eq(trainingRecords.studentId, users.id))
    .orderBy(desc(trainingRecords.createdAt));

  const records = rows.map((r) => ({ ...r.record, studentName: r.studentName }));

  const statusColors: Record<string, string> = {
    active: "text-blue-700 bg-blue-100",
    completed: "text-green-700 bg-green-100",
    suspended: "text-amber-700 bg-amber-100",
    failed: "text-red-700 bg-red-100",
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Training Administration</h1>

      <NewEnrolmentForm />

      <h2 className="mb-3 mt-8 text-lg font-semibold">All Enrolments</h2>

      {records.length === 0 ? (
        <p className="text-muted-foreground">No training records yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3 font-medium">Student</th>
                <th className="py-2 pr-3 font-medium">Course</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Progress</th>
                <th className="py-2 pr-3 font-medium">Start Date</th>
                <th className="py-2 pr-3 font-medium">Target End</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const pct = parseFloat(r.progressPercent);
                return (
                  <tr key={r.id} className="border-b">
                    <td className="py-2 pr-3">{r.studentName ?? "Unknown"}</td>
                    <td className="py-2 pr-3">{r.courseType}</td>
                    <td className="py-2 pr-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[r.status] ?? "text-gray-700 bg-gray-100"}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-2 pr-3">{pct.toFixed(0)}%</td>
                    <td className="py-2 pr-3">
                      {new Date(r.startDate).toLocaleDateString()}
                    </td>
                    <td className="py-2 pr-3">
                      {r.targetEndDate
                        ? new Date(r.targetEndDate).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="py-2">
                      <Link
                        href={`/training/${r.id}`}
                        className="text-sm font-medium text-blue-600 hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

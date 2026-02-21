export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { trainingRecords, lessonCompletions, users, instructors } from "@/db/schema";
import { eq } from "drizzle-orm";
import LessonSignoffForm from "@/components/LessonSignoffForm";

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

export default async function TrainingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");
  const userId = session.user.id;
  const { id } = await params;

  const [record] = await db
    .select()
    .from(trainingRecords)
    .where(eq(trainingRecords.id, id));

  if (!record) redirect("/training");

  const role = await getUserRole(userId);
  if (role !== "admin" && record.studentId !== userId) {
    if (record.instructorId) {
      const [instr] = await db.select().from(instructors).where(eq(instructors.userId, userId));
      if (!instr || instr.id !== record.instructorId) redirect("/training");
    } else {
      redirect("/training");
    }
  }

  const lessons = await db
    .select()
    .from(lessonCompletions)
    .where(eq(lessonCompletions.trainingRecordId, id))
    .orderBy(lessonCompletions.lessonCode);

  // Get student name
  const [student] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, record.studentId));

  const pct = parseFloat(record.progressPercent);
  const canSignOff = role === "instructor" || role === "admin";

  const statusColors: Record<string, string> = {
    active: "text-blue-700 bg-blue-100",
    completed: "text-green-700 bg-green-100",
    suspended: "text-amber-700 bg-amber-100",
    failed: "text-red-700 bg-red-100",
  };

  const outcomeColors: Record<string, string> = {
    not_started: "text-gray-700 bg-gray-100",
    in_progress: "text-blue-700 bg-blue-100",
    passed: "text-green-700 bg-green-100",
    failed: "text-red-700 bg-red-100",
    deferred: "text-amber-700 bg-amber-100",
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold">{record.courseType}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[record.status] ?? "text-gray-700 bg-gray-100"}`}
          >
            {record.status}
          </span>
        </div>
        {student?.name && (
          <p className="text-sm text-muted-foreground mb-1">
            Student: {student.name}
          </p>
        )}
        <p className="text-sm text-muted-foreground mb-3">
          Started: {new Date(record.startDate).toLocaleDateString()}
          {record.targetEndDate &&
            ` | Target: ${new Date(record.targetEndDate).toLocaleDateString()}`}
        </p>
        <div>
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
      </div>

      <h2 className="mb-3 text-lg font-semibold">Lessons</h2>

      {lessons.length === 0 ? (
        <p className="text-muted-foreground mb-6">No lessons recorded yet.</p>
      ) : (
        <div className="mb-6 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-3 font-medium">Code</th>
                <th className="py-2 pr-3 font-medium">Title</th>
                <th className="py-2 pr-3 font-medium">Outcome</th>
                <th className="py-2 pr-3 font-medium">Grade</th>
                <th className="py-2 pr-3 font-medium">Notes</th>
                <th className="py-2 font-medium">Signed Off</th>
              </tr>
            </thead>
            <tbody>
              {lessons.map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="py-2 pr-3 font-mono text-xs">{l.lessonCode}</td>
                  <td className="py-2 pr-3">{l.lessonTitle}</td>
                  <td className="py-2 pr-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${outcomeColors[l.outcome] ?? "text-gray-700 bg-gray-100"}`}
                    >
                      {l.outcome.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-2 pr-3">{l.grade ?? "-"}</td>
                  <td className="py-2 pr-3 max-w-[200px] truncate">
                    {l.instructorNotes ?? "-"}
                  </td>
                  <td className="py-2">
                    {l.signedOffAt
                      ? new Date(l.signedOffAt).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {canSignOff && <LessonSignoffForm trainingRecordId={id} />}
    </main>
  );
}

export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { documents } from "@/db/schema";
import { eq, or, desc } from "drizzle-orm";
import DocumentsClient from "@/components/DocumentsClient";

function getExpiryColor(expiryDate: Date | null): string {
  if (!expiryDate) return "";
  const exp = new Date(expiryDate);
  const now = new Date();
  const daysUntil = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysUntil < 0) return "text-red-600";
  if (daysUntil < 30) return "text-amber-600";
  return "text-green-600";
}

export default async function AccountDocumentsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");
  const userId = session.user.id;

  const rows = await db
    .select()
    .from(documents)
    .where(or(eq(documents.userId, userId), eq(documents.isClubWide, true)))
    .orderBy(desc(documents.createdAt));

  const personalDocs = rows.filter((d) => d.userId === userId && !d.isClubWide);
  const clubDocs = rows.filter((d) => d.isClubWide);

  const mapDoc = (d: typeof rows[number]) => ({
    id: d.id,
    title: d.title,
    category: d.category,
    fileUrl: d.fileUrl,
    mimeType: d.mimeType,
    expiryDate: d.expiryDate?.toISOString() ?? null,
    isClubWide: d.isClubWide,
    isVerified: d.isVerified,
    createdAt: d.createdAt.toISOString(),
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Documents</h1>

      <DocumentsClient documents={personalDocs.map(mapDoc)} />

      <h2 className="text-xl font-semibold mt-10 mb-4">Club Documents</h2>
      {clubDocs.length === 0 ? (
        <p className="text-muted-foreground">No club documents available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Expiry</th>
                <th className="py-2 pr-4">Verified</th>
                <th className="py-2">Link</th>
              </tr>
            </thead>
            <tbody>
              {clubDocs.map((doc) => (
                <tr key={doc.id} className="border-b">
                  <td className="py-2 pr-4">{doc.title}</td>
                  <td className="py-2 pr-4 capitalize">{doc.category.replace("_", " ")}</td>
                  <td className={`py-2 pr-4 ${getExpiryColor(doc.expiryDate)}`}>
                    {doc.expiryDate
                      ? new Date(doc.expiryDate).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="py-2 pr-4">
                    {doc.isVerified ? (
                      <span className="text-green-600">Yes</span>
                    ) : (
                      <span className="text-muted-foreground">No</span>
                    )}
                  </td>
                  <td className="py-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Open
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

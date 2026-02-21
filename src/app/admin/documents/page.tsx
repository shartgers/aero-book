export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { documents, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

function getExpiryColor(expiryDate: string | null): string {
  if (!expiryDate) return "";
  const exp = new Date(expiryDate);
  const now = new Date();
  const daysUntil = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysUntil < 0) return "text-red-600";
  if (daysUntil < 30) return "text-amber-600";
  return "text-green-600";
}

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

const KEY_CATEGORIES = ["licence", "medical", "rating"] as const;

export default async function AdminDocumentsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const role = await getUserRole(session.user.id);
  if (role !== "admin") redirect("/dashboard");

  const rows = await db
    .select({ doc: documents, ownerName: users.name })
    .from(documents)
    .leftJoin(users, eq(documents.userId, users.id))
    .orderBy(desc(documents.createdAt));

  const allDocs = rows.map((r) => ({
    ...r.doc,
    ownerName: r.ownerName,
    expiryDateStr: r.doc.expiryDate?.toISOString() ?? null,
  }));

  // Build compliance grid: group by owner
  const memberDocs = allDocs.filter((d) => d.userId && !d.isClubWide);
  const memberMap = new Map<string, { name: string; docs: typeof memberDocs }>();
  for (const doc of memberDocs) {
    const key = doc.userId!;
    if (!memberMap.has(key)) {
      memberMap.set(key, { name: doc.ownerName ?? "Unknown", docs: [] });
    }
    memberMap.get(key)!.docs.push(doc);
  }

  function getCellStatus(docs: typeof memberDocs, category: string) {
    const catDocs = docs.filter((d) => d.category === category && d.isVerified);
    if (catDocs.length === 0) return "missing";
    const now = new Date();
    for (const d of catDocs) {
      if (d.expiryDate && d.expiryDate < now) continue;
      if (d.expiryDate) {
        const daysUntil = (d.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (daysUntil < 30) return "expiring";
      }
      return "valid";
    }
    return "expired";
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Document Management</h1>

      {/* Compliance Grid */}
      <h2 className="text-xl font-semibold mb-4">Compliance Grid</h2>
      {memberMap.size === 0 ? (
        <p className="text-muted-foreground mb-6">No member documents found.</p>
      ) : (
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Member</th>
                {KEY_CATEGORIES.map((cat) => (
                  <th key={cat} className="py-2 pr-4 capitalize">
                    {cat}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from(memberMap.entries()).map(([uid, { name, docs }]) => (
                <tr key={uid} className="border-b">
                  <td className="py-2 pr-4">{name}</td>
                  {KEY_CATEGORIES.map((cat) => {
                    const status = getCellStatus(docs, cat);
                    return (
                      <td key={cat} className="py-2 pr-4">
                        {status === "valid" && (
                          <span className="text-green-600 font-bold">&#10003;</span>
                        )}
                        {status === "expiring" && (
                          <span className="text-amber-600 font-bold">&#10003;</span>
                        )}
                        {(status === "missing" || status === "expired") && (
                          <span className="text-red-600 font-bold">&#10007;</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* All Documents Table */}
      <h2 className="text-xl font-semibold mb-4">All Documents</h2>
      {allDocs.length === 0 ? (
        <p className="text-muted-foreground">No documents found.</p>
      ) : (
        <div className="overflow-x-auto mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Owner</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Expiry</th>
                <th className="py-2 pr-4">Verified</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allDocs.map((doc) => (
                <tr key={doc.id} className="border-b">
                  <td className="py-2 pr-4">
                    {doc.isClubWide ? "Club" : (doc.ownerName ?? "Unknown")}
                  </td>
                  <td className="py-2 pr-4">{doc.title}</td>
                  <td className="py-2 pr-4 capitalize">
                    {doc.category.replace("_", " ")}
                  </td>
                  <td className={`py-2 pr-4 ${getExpiryColor(doc.expiryDateStr)}`}>
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
                      className="text-blue-600 underline mr-2"
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

      {/* Add Club Document Form */}
      <h2 className="text-xl font-semibold mb-4">Add Club Document</h2>
      <AdminAddDocumentForm />
    </main>
  );
}

function AdminAddDocumentForm() {
  async function handleSubmit(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const category = formData.get("category") as string;
    const fileUrl = formData.get("fileUrl") as string;
    const mimeType = (formData.get("mimeType") as string) || "application/pdf";
    const expiryDate = formData.get("expiryDate") as string;

    const { data: session } = await auth.getSession();
    if (!session?.user) return;

    const role = await getUserRole(session.user.id);
    if (role !== "admin") return;

    await db.insert(documents).values({
      title,
      category: category as "licence" | "medical" | "rating" | "type_rating" | "insurance" | "club_agreement" | "notam" | "sop" | "arc" | "other",
      fileUrl,
      mimeType,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isClubWide: true,
      uploadedBy: session.user.id,
      userId: null,
    });

    const { redirect: redir } = await import("next/navigation");
    redir("/admin/documents");
  }

  const categories = [
    "licence", "medical", "rating", "type_rating", "insurance",
    "club_agreement", "notam", "sop", "arc", "other",
  ];

  return (
    <form action={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">
          Category
        </label>
        <select
          id="category"
          name="category"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="fileUrl" className="block text-sm font-medium mb-1">
          File URL
        </label>
        <input
          id="fileUrl"
          name="fileUrl"
          type="url"
          required
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="mimeType" className="block text-sm font-medium mb-1">
          MIME Type
        </label>
        <input
          id="mimeType"
          name="mimeType"
          type="text"
          defaultValue="application/pdf"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="expiryDate" className="block text-sm font-medium mb-1">
          Expiry Date (optional)
        </label>
        <input
          id="expiryDate"
          name="expiryDate"
          type="date"
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
      >
        Add Club Document
      </button>
    </form>
  );
}

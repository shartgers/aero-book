"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface DocumentRow {
  id: string;
  title: string;
  category: string;
  fileUrl: string;
  mimeType: string;
  expiryDate: string | null;
  isClubWide: boolean;
  isVerified: boolean;
  createdAt: string;
}

function getExpiryColor(expiryDate: string | null): string {
  if (!expiryDate) return "";
  const exp = new Date(expiryDate);
  const now = new Date();
  const daysUntil = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (daysUntil < 0) return "text-red-600";
  if (daysUntil < 30) return "text-amber-600";
  return "text-green-600";
}

const CATEGORIES = [
  "licence", "medical", "rating", "type_rating", "insurance",
  "club_agreement", "notam", "sop", "arc", "other",
] as const;

export default function DocumentsClient({ documents }: { documents: DocumentRow[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("licence");
  const [fileUrl, setFileUrl] = useState("");
  const [mimeType, setMimeType] = useState("application/pdf");
  const [expiryDate, setExpiryDate] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          fileUrl,
          mimeType,
          expiryDate: expiryDate || undefined,
        }),
      });
      if (res.ok) {
        setTitle("");
        setCategory("licence");
        setFileUrl("");
        setMimeType("application/pdf");
        setExpiryDate("");
        setShowForm(false);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Personal Documents</h2>
        <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add Document"}
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 mb-6 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">File URL</label>
            <input
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              required
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">MIME Type</label>
            <input
              type="text"
              value={mimeType}
              onChange={(e) => setMimeType(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expiry Date (optional)</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Document"}
          </Button>
        </form>
      )}

      {documents.length === 0 ? (
        <p className="text-muted-foreground">No personal documents yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Expiry</th>
                <th className="py-2 pr-4">Verified</th>
                <th className="py-2 pr-4">Link</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
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
                  <td className="py-2 pr-4">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Open
                    </a>
                  </td>
                  <td className="py-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

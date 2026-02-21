"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Certificate {
  id: string;
  type: string;
  expiryDate: string;
  verified: boolean;
  documentUrl?: string | null;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function expiryColor(days: number): string {
  if (days <= 0) return "text-red-700 dark:text-red-400 font-bold";
  if (days < 7) return "text-red-600 dark:text-red-400";
  if (days <= 30) return "text-amber-600 dark:text-amber-400";
  return "text-green-600 dark:text-green-400";
}

function expiryText(days: number): string {
  if (days <= 0) return "EXPIRED";
  return `${days}d`;
}

export function CertificatesClient({ initialCertificates }: { initialCertificates: Certificate[] }) {
  const [certificates, setCertificates] = useState(initialCertificates);
  const [newType, setNewType] = useState("medical");
  const [newExpiry, setNewExpiry] = useState("");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newExpiry) {
      setError("Expiry date is required.");
      return;
    }
    setAdding(true);
    setError("");

    try {
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: newType,
          expiryDate: newExpiry,
          documentUrl: newDocUrl || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to add certificate.");
        setAdding(false);
        return;
      }

      const cert = await res.json();
      setCertificates((prev) => [...prev, cert]);
      setNewExpiry("");
      setNewDocUrl("");
    } catch {
      setError("Network error.");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Certificates table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-4 py-2 text-left font-medium">Type</th>
              <th className="px-4 py-2 text-left font-medium">Expiry Date</th>
              <th className="px-4 py-2 text-left font-medium">Days Left</th>
              <th className="px-4 py-2 text-left font-medium">Verified</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((cert) => {
              const days = daysUntil(cert.expiryDate);
              return (
                <tr key={cert.id} className="border-b">
                  <td className="px-4 py-2 capitalize">{cert.type}</td>
                  <td className="px-4 py-2">{new Date(cert.expiryDate).toLocaleDateString()}</td>
                  <td className={cn("px-4 py-2", expiryColor(days))}>{expiryText(days)}</td>
                  <td className="px-4 py-2">
                    {cert.verified ? (
                      <span className="text-green-600">Verified</span>
                    ) : (
                      <span className="text-muted-foreground">Pending</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {certificates.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  No certificates on file.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add certificate form */}
      <Card>
        <form onSubmit={handleAdd}>
          <CardHeader>
            <CardTitle className="text-base">Add Certificate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="certType">Type</Label>
              <select
                id="certType"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <option value="medical">Medical</option>
                <option value="license">License</option>
                <option value="rating">Rating</option>
              </select>
            </div>
            <div>
              <Label htmlFor="certExpiry">Expiry Date</Label>
              <Input
                id="certExpiry"
                type="date"
                value={newExpiry}
                onChange={(e) => setNewExpiry(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="certDocUrl">Document URL (optional)</Label>
              <Input
                id="certDocUrl"
                type="url"
                value={newDocUrl}
                onChange={(e) => setNewDocUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={adding}>
              {adding ? "Adding..." : "Add Certificate"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

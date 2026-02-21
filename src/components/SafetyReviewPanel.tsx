"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface SafetyReportFull {
  id: string;
  category: string;
  severity: string;
  description: string;
  dateOfOccurrence: string;
  location: string | null;
  status: string;
  resolution: string | null;
  isAnonymous: boolean;
  reporterName: string | null;
  createdAt: string;
}

const STATUS_OPTIONS = ["submitted", "under_review", "closed"] as const;

const severityColors: Record<string, string> = {
  hazard: "bg-yellow-100 text-yellow-800",
  incident: "bg-orange-100 text-orange-800",
  serious_incident: "bg-red-100 text-red-800",
  accident: "bg-red-200 text-red-900",
};

export function SafetyReviewPanel({ report }: { report: SafetyReportFull }) {
  const [status, setStatus] = useState(report.status);
  const [resolution, setResolution] = useState(report.resolution ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function handleSave() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/safety/${report.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolution: resolution || null }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || "Failed to save review");
        return;
      }

      setMessage("Review saved");
    } catch {
      setMessage("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {new Date(report.createdAt).toLocaleDateString()} &mdash;{" "}
            {report.category.replace(/_/g, " ")}
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityColors[report.severity] ?? "bg-gray-100 text-gray-800"}`}>
              {report.severity.replace(/_/g, " ")}
            </span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
              {report.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Reporter: {report.isAnonymous ? "Anonymous" : (report.reporterName ?? "Unknown")}
        </p>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <p><strong>Date of Occurrence:</strong> {new Date(report.dateOfOccurrence).toLocaleString()}</p>
            {report.location && <p><strong>Location:</strong> {report.location}</p>}
            <p><strong>Description:</strong></p>
            <p className="whitespace-pre-wrap rounded bg-muted p-3">{report.description}</p>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div>
              <Label htmlFor={`status-${report.id}`}>Status</Label>
              <select
                id={`status-${report.id}`}
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor={`resolution-${report.id}`}>Resolution</Label>
              <textarea
                id={`resolution-${report.id}`}
                value={resolution}
                onChange={e => setResolution(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Describe the resolution or actions taken..."
              />
            </div>

            {message && (
              <p className={`text-sm ${message === "Review saved" ? "text-green-700" : "text-red-600"}`}>
                {message}
              </p>
            )}

            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Review"}
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

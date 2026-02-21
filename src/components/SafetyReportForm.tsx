"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CATEGORIES = [
  { value: "airprox", label: "Airprox" },
  { value: "runway_incursion", label: "Runway Incursion" },
  { value: "bird_strike", label: "Bird Strike" },
  { value: "technical_fault", label: "Technical Fault" },
  { value: "near_miss", label: "Near Miss" },
  { value: "other", label: "Other" },
];

const SEVERITIES = [
  { value: "hazard", label: "Hazard" },
  { value: "incident", label: "Incident" },
  { value: "serious_incident", label: "Serious Incident" },
  { value: "accident", label: "Accident" },
];

export function SafetyReportForm() {
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  const [dateOfOccurrence, setDateOfOccurrence] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ id: string; message: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/safety/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          severity,
          dateOfOccurrence,
          location: location || undefined,
          description,
          isAnonymous,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to submit report");
        return;
      }

      const data = await res.json();
      setResult(data);
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-green-700 font-medium">
            Report submitted. Your reference number is: {result.id}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Safety Report</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              value={category}
              onChange={e => setCategory(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select category...</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="severity">Severity</Label>
            <select
              id="severity"
              value={severity}
              onChange={e => setSeverity(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select severity...</option>
              {SEVERITIES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="dateOfOccurrence">Date of Occurrence</Label>
            <Input
              id="dateOfOccurrence"
              type="datetime-local"
              value={dateOfOccurrence}
              onChange={e => setDateOfOccurrence(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="location">Location (optional)</Label>
            <Input
              id="location"
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Runway 27, Circuit area"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              rows={5}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Describe what happened..."
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isAnonymous"
              type="checkbox"
              checked={isAnonymous}
              onChange={e => setIsAnonymous(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor="isAnonymous">Submit anonymously</Label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Report"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

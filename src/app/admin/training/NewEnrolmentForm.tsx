"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function NewEnrolmentForm() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [courseType, setCourseType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const res = await fetch("/api/training", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, courseType, startDate }),
    });

    if (res.ok) {
      setMessage("Enrolment created successfully.");
      setStudentId("");
      setCourseType("");
      setStartDate("");
      router.refresh();
    } else {
      const err = await res.json().catch(() => null);
      setMessage(err?.error ?? "Failed to create enrolment.");
    }

    setSubmitting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Enrolment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                placeholder="UUID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="courseType">Course Type</Label>
              <Input
                id="courseType"
                placeholder="e.g. PPL, CPL"
                value={courseType}
                onChange={(e) => setCourseType(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
          </div>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Enrolment"}
          </Button>
          {message && (
            <p className="text-sm mt-2 text-muted-foreground">{message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

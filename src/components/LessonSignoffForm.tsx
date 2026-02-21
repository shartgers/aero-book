"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function LessonSignoffForm({
  trainingRecordId,
}: {
  trainingRecordId: string;
}) {
  const router = useRouter();
  const [lessonCode, setLessonCode] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [outcome, setOutcome] = useState("passed");
  const [grade, setGrade] = useState("");
  const [instructorNotes, setInstructorNotes] = useState("");
  const [cbtaNotes, setCbtaNotes] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    const res = await fetch(`/api/training/${trainingRecordId}/lessons`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lessonCode,
        lessonTitle,
        outcome,
        grade: grade ? parseInt(grade) : undefined,
        instructorNotes: instructorNotes || undefined,
        cbtaAssessmentData: cbtaNotes ? { notes: cbtaNotes } : undefined,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessage(
        `Lesson signed off successfully. Progress: ${data.progressPercent}%`
      );
      setLessonCode("");
      setLessonTitle("");
      setOutcome("passed");
      setGrade("");
      setInstructorNotes("");
      setCbtaNotes("");
      router.refresh();
    } else {
      const err = await res.json().catch(() => null);
      setMessage(err?.error ?? "Failed to sign off lesson.");
    }

    setSubmitting(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign Off Lesson</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lessonCode">Lesson Code</Label>
              <Input
                id="lessonCode"
                placeholder="e.g. PPL-EX01"
                value={lessonCode}
                onChange={(e) => setLessonCode(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="lessonTitle">Lesson Title</Label>
              <Input
                id="lessonTitle"
                placeholder="e.g. Effects of Controls"
                value={lessonTitle}
                onChange={(e) => setLessonTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="outcome">Outcome</Label>
              <select
                id="outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="deferred">Deferred</option>
              </select>
            </div>
            <div>
              <Label htmlFor="grade">Grade (optional)</Label>
              <select
                id="grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="">No grade</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="instructorNotes">Instructor Notes (optional)</Label>
            <textarea
              id="instructorNotes"
              value={instructorNotes}
              onChange={(e) => setInstructorNotes(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            />
          </div>

          <div>
            <Label htmlFor="cbtaNotes">CBTA Assessment Notes (optional)</Label>
            <textarea
              id="cbtaNotes"
              value={cbtaNotes}
              onChange={(e) => setCbtaNotes(e.target.value)}
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
            />
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? "Signing off..." : "Sign Off Lesson"}
          </Button>

          {message && (
            <p className="text-sm mt-2 text-muted-foreground">{message}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

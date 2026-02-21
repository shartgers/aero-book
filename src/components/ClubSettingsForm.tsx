"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

interface ClubSettingsFormProps {
  initial: {
    overlapWindowMinutes: number;
    defaultBookingDurationMinutes: number;
    maxBookingDurationHours: number;
  };
}

export function ClubSettingsForm({ initial }: ClubSettingsFormProps) {
  const [overlapWindow, setOverlapWindow] = useState(String(initial.overlapWindowMinutes));
  const [defaultDuration, setDefaultDuration] = useState(String(initial.defaultBookingDurationMinutes));
  const [maxDuration, setMaxDuration] = useState(String(initial.maxBookingDurationHours));
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          overlapWindowMinutes: Number(overlapWindow),
          defaultBookingDurationMinutes: Number(defaultDuration),
          maxBookingDurationHours: Number(maxDuration),
        }),
      });
      setStatus(res.ok ? "saved" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-lg">Club Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="overlapWindow">Overlap Window (minutes)</Label>
            <Input
              id="overlapWindow"
              type="number"
              min={0}
              value={overlapWindow}
              onChange={(e) => { setOverlapWindow(e.target.value); setStatus("idle"); }}
            />
          </div>
          <div>
            <Label htmlFor="defaultDuration">Default Booking Duration (minutes)</Label>
            <Input
              id="defaultDuration"
              type="number"
              min={15}
              value={defaultDuration}
              onChange={(e) => { setDefaultDuration(e.target.value); setStatus("idle"); }}
            />
          </div>
          <div>
            <Label htmlFor="maxDuration">Max Booking Duration (hours)</Label>
            <Input
              id="maxDuration"
              type="number"
              min={1}
              value={maxDuration}
              onChange={(e) => { setMaxDuration(e.target.value); setStatus("idle"); }}
            />
          </div>
          {status === "saved" && (
            <p className="text-sm text-green-600">Settings saved.</p>
          )}
          {status === "error" && (
            <p className="text-sm text-red-600">Failed to save settings. Try again.</p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Saving..." : "Save Settings"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddIntervalForm({ aircraftId }: { aircraftId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/aircraft/${aircraftId}/intervals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          intervalHours: form.get("intervalHours"),
          warningThresholdHours: form.get("warningThresholdHours") || "10",
        }),
      });
      if (res.ok) {
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4 items-end">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" name="name" required placeholder="e.g. 100hr Check" />
      </div>
      <div>
        <Label htmlFor="intervalHours">Interval (hrs)</Label>
        <Input id="intervalHours" name="intervalHours" type="number" step="0.1" required />
      </div>
      <div>
        <Label htmlFor="warningThresholdHours">Warning (hrs)</Label>
        <Input id="warningThresholdHours" name="warningThresholdHours" type="number" step="0.1" defaultValue="10" />
      </div>
      <div className="col-span-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Adding..." : "Add Interval"}
        </Button>
      </div>
    </form>
  );
}

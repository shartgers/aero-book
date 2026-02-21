"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface WaitlistButtonProps {
  aircraftId: string;
  startTime: string;
  endTime: string;
}

export function WaitlistButton({ aircraftId, startTime, endTime }: WaitlistButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function handleClick() {
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aircraftId, startTime, endTime }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <p className="text-sm text-green-600">
        You are on the waitlist. We will notify you if this becomes available.
      </p>
    );
  }

  return (
    <div>
      <Button
        variant="secondary"
        size="sm"
        onClick={handleClick}
        disabled={status === "loading"}
      >
        {status === "loading" ? "Joining..." : "Notify me if this becomes available"}
      </Button>
      {status === "error" && (
        <p className="mt-1 text-sm text-red-600">Failed to join waitlist. Try again.</p>
      )}
    </div>
  );
}

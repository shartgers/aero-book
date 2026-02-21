"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RecordCompletionButton({
  aircraftId,
  intervalId,
  currentHobbs,
}: {
  aircraftId: string;
  intervalId: string;
  currentHobbs: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/aircraft/${aircraftId}/intervals/${intervalId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lastCompletedAt: currentHobbs }),
        }
      );
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} disabled={loading}>
      {loading ? "..." : "Complete"}
    </Button>
  );
}

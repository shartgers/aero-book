"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function InstructorSignoffButton({
  entryId,
  userId,
}: {
  entryId: string;
  userId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignoff() {
    setLoading(true);
    try {
      const res = await fetch(`/api/logbook/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructorSignoff: userId }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleSignoff} disabled={loading}>
      {loading ? "Signing off..." : "Sign Off"}
    </Button>
  );
}

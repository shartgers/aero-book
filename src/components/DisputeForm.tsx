"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

interface DisputeFormProps {
  billId: string;
  onSuccess: () => void;
}

export function DisputeForm({ billId, onSuccess }: DisputeFormProps) {
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;

    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/bills/${billId}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error ?? "Failed to submit dispute.");
        setStatus("error");
        return;
      }

      setStatus("success");
      onSuccess();
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-green-600 font-medium">Dispute submitted successfully.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-base">Dispute This Bill</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="disputeReason">Reason for dispute</Label>
            <textarea
              id="disputeReason"
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none min-h-[80px]"
              placeholder="Describe why you are disputing this bill..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>
          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" variant="outline" disabled={status === "submitting" || !reason.trim()}>
            {status === "submitting" ? "Submitting..." : "Submit Dispute"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import type { BillStatus } from "@/components/BillStatusBadge";

interface AdminBillControlsProps {
  bill: {
    id: string;
    aircraftCost: number;
    instructorCost?: number | null;
    landingFees?: number | null;
    surcharges?: number | null;
    totalAmount: number;
    status: BillStatus;
  };
}

const ALL_STATUSES: BillStatus[] = ["pending", "paid", "disputed", "refunded"];

export function AdminBillControls({ bill }: AdminBillControlsProps) {
  const [aircraftCost, setAircraftCost] = useState(String(bill.aircraftCost));
  const [instructorCost, setInstructorCost] = useState(String(bill.instructorCost ?? ""));
  const [landingFees, setLandingFees] = useState(String(bill.landingFees ?? ""));
  const [surcharges, setSurcharges] = useState(String(bill.surcharges ?? ""));
  const [statusOverride, setStatusOverride] = useState(bill.status);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveStatus("saving");

    try {
      const res = await fetch(`/api/admin/bills/${bill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aircraftCost: Number(aircraftCost) || undefined,
          instructorCost: instructorCost ? Number(instructorCost) : undefined,
          landingFees: landingFees ? Number(landingFees) : undefined,
          surcharges: surcharges ? Number(surcharges) : undefined,
          status: statusOverride,
        }),
      });

      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    }
  }

  return (
    <Card>
      <form onSubmit={handleSave}>
        <CardHeader>
          <CardTitle className="text-base">Admin Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="adminAircraftCost">Aircraft Cost</Label>
              <Input
                id="adminAircraftCost"
                type="number"
                step="0.01"
                min="0"
                value={aircraftCost}
                onChange={(e) => { setAircraftCost(e.target.value); setSaveStatus("idle"); }}
              />
            </div>
            <div>
              <Label htmlFor="adminInstructorCost">Instructor Cost</Label>
              <Input
                id="adminInstructorCost"
                type="number"
                step="0.01"
                min="0"
                value={instructorCost}
                onChange={(e) => { setInstructorCost(e.target.value); setSaveStatus("idle"); }}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="adminLandingFees">Landing Fees</Label>
              <Input
                id="adminLandingFees"
                type="number"
                step="0.01"
                min="0"
                value={landingFees}
                onChange={(e) => { setLandingFees(e.target.value); setSaveStatus("idle"); }}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="adminSurcharges">Surcharges</Label>
              <Input
                id="adminSurcharges"
                type="number"
                step="0.01"
                min="0"
                value={surcharges}
                onChange={(e) => { setSurcharges(e.target.value); setSaveStatus("idle"); }}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="adminStatus">Override Status</Label>
            <select
              id="adminStatus"
              value={statusOverride}
              onChange={(e) => { setStatusOverride(e.target.value as BillStatus); setSaveStatus("idle"); }}
              className="mt-1 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {saveStatus === "saved" && (
            <p className="text-sm text-green-600">Changes saved.</p>
          )}
          {saveStatus === "error" && (
            <p className="text-sm text-red-600">Failed to save changes.</p>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={saveStatus === "saving"}>
            {saveStatus === "saving" ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

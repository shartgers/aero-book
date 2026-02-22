"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function LogbookEntryDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);

    const totalTime = parseFloat(form.get("totalTime") as string);
    if (!totalTime || totalTime <= 0) {
      setError("Total time must be greater than 0.");
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        entryDate: form.get("entryDate"),
        aircraftType: form.get("aircraftType"),
        tailNumber: form.get("tailNumber"),
        departureIcao: form.get("departureIcao") || null,
        arrivalIcao: form.get("arrivalIcao") || null,
        totalTime,
        picTime: form.get("picTime") ? parseFloat(form.get("picTime") as string) : null,
        dualTime: form.get("dualTime") ? parseFloat(form.get("dualTime") as string) : null,
        soloTime: form.get("soloTime") ? parseFloat(form.get("soloTime") as string) : null,
        nightTime: form.get("nightTime") ? parseFloat(form.get("nightTime") as string) : null,
        instrumentTime: form.get("instrumentTime") ? parseFloat(form.get("instrumentTime") as string) : null,
        crossCountryTime: form.get("crossCountryTime") ? parseFloat(form.get("crossCountryTime") as string) : null,
        landingsDay: form.get("landingsDay") ? parseInt(form.get("landingsDay") as string) : null,
        landingsNight: form.get("landingsNight") ? parseInt(form.get("landingsNight") as string) : null,
        flightType: form.get("flightType"),
        remarks: form.get("remarks") || null,
      };

      const res = await fetch("/api/logbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setOpen(false);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add entry.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Entry</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Logbook Entry</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="entryDate">Date</Label>
              <Input id="entryDate" name="entryDate" type="date" required />
            </div>
            <div>
              <Label htmlFor="flightType">Flight Type</Label>
              <select
                id="flightType"
                name="flightType"
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="solo">Solo</option>
                <option value="dual">Dual</option>
                <option value="pic">PIC</option>
                <option value="instruction">Instruction</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="aircraftType">Aircraft Type</Label>
              <Input id="aircraftType" name="aircraftType" required placeholder="e.g. C172" />
            </div>
            <div>
              <Label htmlFor="tailNumber">Tail Number</Label>
              <Input id="tailNumber" name="tailNumber" required placeholder="e.g. PH-ABC" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departureIcao">Departure ICAO</Label>
              <Input id="departureIcao" name="departureIcao" placeholder="e.g. EHLE" />
            </div>
            <div>
              <Label htmlFor="arrivalIcao">Arrival ICAO</Label>
              <Input id="arrivalIcao" name="arrivalIcao" placeholder="e.g. EHLE" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="totalTime">Total Time *</Label>
              <Input id="totalTime" name="totalTime" type="number" step="0.1" min="0.1" required />
            </div>
            <div>
              <Label htmlFor="picTime">PIC Time</Label>
              <Input id="picTime" name="picTime" type="number" step="0.1" />
            </div>
            <div>
              <Label htmlFor="dualTime">Dual Time</Label>
              <Input id="dualTime" name="dualTime" type="number" step="0.1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="soloTime">Solo Time</Label>
              <Input id="soloTime" name="soloTime" type="number" step="0.1" />
            </div>
            <div>
              <Label htmlFor="nightTime">Night Time</Label>
              <Input id="nightTime" name="nightTime" type="number" step="0.1" />
            </div>
            <div>
              <Label htmlFor="instrumentTime">Instrument Time</Label>
              <Input id="instrumentTime" name="instrumentTime" type="number" step="0.1" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="crossCountryTime">Cross Country Time</Label>
              <Input id="crossCountryTime" name="crossCountryTime" type="number" step="0.1" />
            </div>
            <div>
              <Label htmlFor="landingsDay">Landings (Day)</Label>
              <Input id="landingsDay" name="landingsDay" type="number" min="0" />
            </div>
            <div>
              <Label htmlFor="landingsNight">Landings (Night)</Label>
              <Input id="landingsNight" name="landingsNight" type="number" min="0" />
            </div>
          </div>

          <div>
            <Label htmlFor="remarks">Remarks</Label>
            <textarea
              id="remarks"
              name="remarks"
              rows={2}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Entry"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { InstructorCard } from "@/components/InstructorCard";
import Link from "next/link";

interface AircraftOption {
  id: string;
  tailNumber: string;
  type: string;
  hourlyRate: string;
}

interface Instructor {
  id: string;
  userId: string;
  hourlyRate: string;
  bio: string | null;
  isActive: boolean;
  user: { name: string | null; email: string };
  qualifications: string[];
}

// Steps: 1=Date & Time, 2=Available aircraft, 3=Instructor (optional), 4=Confirm
const STEP_LABELS = ["Date & Time", "Aircraft", "Instructor", "Confirm"];

export default function NewBookingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [availableAircraft, setAvailableAircraft] = useState<AircraftOption[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftOption | null>(null);
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("09:00");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Instructor state
  const [wantInstructor, setWantInstructor] = useState(false);
  const [instructorList, setInstructorList] = useState<Instructor[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [instructorsLoaded, setInstructorsLoaded] = useState(false);

  // When user reaches step 2, fetch aircraft available for the chosen slot
  useEffect(() => {
    if (step !== 2 || !date || !startTime || !endTime || startTime >= endTime) return;

    const startISO = new Date(`${date}T${startTime}`).toISOString();
    const endISO = new Date(`${date}T${endTime}`).toISOString();

    let cancelled = false;
    setLoadingAvailable(true);
    setAvailableAircraft([]);

    fetch(`/api/bookings/available-aircraft?startTime=${encodeURIComponent(startISO)}&endTime=${encodeURIComponent(endISO)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled) setAvailableAircraft(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setAvailableAircraft([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailable(false);
      });

    return () => {
      cancelled = true;
    };
  }, [step, date, startTime, endTime]);

  function selectAircraft(ac: AircraftOption) {
    setSelectedAircraft(ac);
  }

  function goToAircraftStep() {
    if (!date || !startTime || !endTime) {
      setError("Please fill in date and time.");
      return;
    }
    if (startTime >= endTime) {
      setError("End time must be after start time.");
      return;
    }
    setError("");
    setSelectedAircraft(null);
    setStep(2);
  }

  function goToInstructorStep() {
    if (!selectedAircraft) {
      setError("Please select an aircraft.");
      return;
    }
    setError("");
    setStep(3);
  }

  async function loadInstructors() {
    if (instructorsLoaded) return;
    try {
      const res = await fetch("/api/instructors");
      if (res.ok) {
        const data = await res.json();
        setInstructorList(data);
      }
    } catch {
      // ignore
    } finally {
      setInstructorsLoaded(true);
    }
  }

  function toggleInstructor(on: boolean) {
    setWantInstructor(on);
    if (on) {
      loadInstructors();
    } else {
      setSelectedInstructorId(null);
    }
  }

  function goToConfirm() {
    setError("");
    setStep(4);
  }

  function backFromAircraft() {
    setSelectedAircraft(null);
    setError("");
    setStep(1);
  }

  async function handleSubmit() {
    if (!selectedAircraft) return;
    setLoading(true);
    setError("");

    const startISO = new Date(`${date}T${startTime}`).toISOString();
    const endISO = new Date(`${date}T${endTime}`).toISOString();

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aircraftId: selectedAircraft.id,
          startTime: startISO,
          endTime: endISO,
          notes: notes || undefined,
          instructorId: selectedInstructorId || undefined,
        }),
      });

      // Parse error body safely: server may return JSON or HTML (e.g. on 500)
      if (!res.ok) {
        let errMsg = "Failed to create booking.";
        try {
          const data = await res.json();
          if (data && typeof data.error === "string") errMsg = data.error;
        } catch {
          // Non-JSON response (e.g. HTML error page); use status text as hint
          errMsg = res.status === 401 ? "Please sign in again." : errMsg;
        }
        setError(errMsg);
        setLoading(false);
        return;
      }

      const data = await res.json();
      router.push(data.id ? `/bookings/${data.id}` : "/bookings");
    } catch (e) {
      // True network failure or client-side throw (e.g. abort)
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const selectedInstructor = instructorList.find((i) => i.id === selectedInstructorId);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/bookings">&larr; Back to bookings</Link>
        </Button>
      </div>

      <h1 className="mb-6 text-2xl font-bold">New Booking</h1>

      {/* Step indicators */}
      <div className="mb-6 flex gap-2 text-sm">
        {[1, 2, 3, 4].map((s) => (
          <span
            key={s}
            className={`rounded-full px-3 py-1 ${
              s === step
                ? "bg-primary text-primary-foreground"
                : s < step
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {STEP_LABELS[s - 1]}
          </span>
        ))}
      </div>

      {/* Step 1: Date & Time */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Pick date and time</CardTitle>
            <p className="text-muted-foreground text-sm">Choose when you want to fly; next you’ll see aircraft available for this slot.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => { setDate(e.target.value); setError(""); }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => { setStartTime(e.target.value); setError(""); }}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => { setEndTime(e.target.value); setError(""); }}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Cross-country flight"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={goToAircraftStep}>Next</Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Available aircraft for the chosen slot */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Choose an aircraft</CardTitle>
            <p className="text-muted-foreground text-sm">
              Available for {date} from {startTime} to {endTime}
            </p>
          </CardHeader>
          <CardContent>
            {loadingAvailable && (
              <p className="text-muted-foreground text-center py-6">Loading available aircraft...</p>
            )}
            {!loadingAvailable && availableAircraft.length === 0 && (
              <p className="text-muted-foreground text-center py-6">No aircraft available for this slot. Try another date or time.</p>
            )}
            {!loadingAvailable && availableAircraft.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {availableAircraft.map((ac) => (
                  <Card
                    key={ac.id}
                    className={`cursor-pointer transition-shadow hover:shadow-md ${
                      selectedAircraft?.id === ac.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => selectAircraft(ac)}
                  >
                    <CardContent className="pt-6">
                      <div className="text-lg font-semibold">{ac.tailNumber}</div>
                      <div className="text-muted-foreground text-sm">{ac.type}</div>
                      <div className="text-muted-foreground mt-1 text-sm">${ac.hourlyRate}/hr</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={backFromAircraft}>
              Back
            </Button>
            <Button onClick={goToInstructorStep} disabled={!selectedAircraft}>
              Next
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Instructor (optional) */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Book with an instructor?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={wantInstructor}
                onChange={(e) => toggleInstructor(e.target.checked)}
                className="h-4 w-4 rounded border-input"
              />
              <span className="text-sm font-medium">Add an instructor to this booking</span>
            </label>

            {wantInstructor && (
              <div className="space-y-3">
                {!instructorsLoaded && (
                  <p className="text-muted-foreground text-sm">Loading instructors...</p>
                )}
                {instructorsLoaded && instructorList.length === 0 && (
                  <p className="text-muted-foreground text-sm">No instructors available.</p>
                )}
                {instructorList.map((inst) => (
                  <InstructorCard
                    key={inst.id}
                    instructor={inst}
                    selected={selectedInstructorId === inst.id}
                    onSelect={(id) =>
                      setSelectedInstructorId(selectedInstructorId === id ? null : id)
                    }
                  />
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button onClick={goToConfirm}>
              {wantInstructor && !selectedInstructorId ? "Skip & Continue" : "Next"}
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Confirm Booking</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Aircraft</dt>
                <dd className="font-medium">{selectedAircraft?.tailNumber} ({selectedAircraft?.type})</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Date</dt>
                <dd className="font-medium">{date}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Time</dt>
                <dd className="font-medium">{startTime} &ndash; {endTime}</dd>
              </div>
              {selectedInstructor && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Instructor</dt>
                  <dd className="font-medium">
                    {selectedInstructor.user.name ?? selectedInstructor.user.email}
                  </dd>
                </div>
              )}
              {notes && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Notes</dt>
                  <dd className="font-medium">{notes}</dd>
                </div>
              )}
            </dl>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>
              Back
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Booking..." : "Confirm Booking"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

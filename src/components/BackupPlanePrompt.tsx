"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface BackupOption {
  id: string;
  tailNumber: string;
  type: string;
  hourlyRate: string;
}

interface BackupPlanePromptProps {
  originalAircraftId: string;
  startTime: string;
  endTime: string;
  onSelect: (aircraftId: string) => void;
}

export function BackupPlanePrompt({
  originalAircraftId,
  startTime,
  endTime,
  onSelect,
}: BackupPlanePromptProps) {
  const [options, setOptions] = useState<BackupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [waitlisted, setWaitlisted] = useState(false);
  const [waitlistLoading, setWaitlistLoading] = useState(false);

  useEffect(() => {
    async function fetchBackups() {
      try {
        const params = new URLSearchParams({
          aircraftId: originalAircraftId,
          startTime,
          endTime,
        });
        const res = await fetch(`/api/bookings/backup-options?${params}`);
        if (res.ok) {
          const data = await res.json();
          setOptions(data);
        }
      } catch {
        // silently fail — prompt is advisory
      } finally {
        setLoading(false);
      }
    }
    fetchBackups();
  }, [originalAircraftId, startTime, endTime]);

  async function joinWaitlist() {
    setWaitlistLoading(true);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aircraftId: originalAircraftId,
          startTime,
          endTime,
        }),
      });
      if (res.ok) {
        setWaitlisted(true);
      }
    } catch {
      // ignore
    } finally {
      setWaitlistLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Checking alternatives...
        </CardContent>
      </Card>
    );
  }

  const best = options[0];
  const rest = options.slice(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Your preferred aircraft is taken
          {best ? " — here's the best alternative:" : ""}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {best ? (
          <>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="font-semibold">{best.tailNumber}</div>
                <div className="text-muted-foreground text-sm">{best.type}</div>
                <div className="text-muted-foreground text-sm">${best.hourlyRate}/hr</div>
              </div>
              <Button size="sm" onClick={() => onSelect(best.id)}>
                Book this instead
              </Button>
            </div>

            {rest.length > 0 && (
              <>
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? "Hide" : "See"} all alternatives ({rest.length})
                </button>
                {showAll && (
                  <div className="space-y-2">
                    {rest.map((ac) => (
                      <div
                        key={ac.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div>
                          <div className="font-medium">{ac.tailNumber}</div>
                          <div className="text-muted-foreground text-sm">
                            {ac.type} &middot; ${ac.hourlyRate}/hr
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onSelect(ac.id)}
                        >
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No alternative aircraft are available for this time slot.
          </p>
        )}
      </CardContent>
      <CardFooter>
        {waitlisted ? (
          <p className="text-sm text-green-600">
            You are on the waitlist. We will notify you if this slot opens up.
          </p>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={joinWaitlist}
            disabled={waitlistLoading}
          >
            {waitlistLoading ? "Joining..." : "Join waitlist"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

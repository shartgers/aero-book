"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const LiveFlightsMap = dynamic(
  () => import("./LiveFlightsMap").then((m) => ({ default: m.LiveFlightsMap })),
  { ssr: false, loading: () => <div className="h-[320px] w-full rounded-lg border border-border bg-muted animate-pulse" /> }
);

/** Single flight from FR24 live positions (full) response. */
export interface LiveFlightPosition {
  fr24_id?: string;
  flight?: string;
  callsign?: string;
  lat?: number;
  lon?: number;
  track?: number;
  alt?: number;
  gspeed?: number;
  vspeed?: number;
  squawk?: string;
  timestamp?: string;
  hex?: string;
  type?: string;
  reg?: string;
  orig_iata?: string;
  orig_icao?: string;
  dest_iata?: string;
  dest_icao?: string;
  eta?: string;
  [key: string]: unknown;
}

interface ApiResponse {
  data?: LiveFlightPosition[];
  error?: string;
}

/**
 * Fetches live flight positions from our API (which proxies FR24) and displays a list.
 * Shows loading and error states; supports refresh.
 */
export function LiveFlightsList() {
  const [refreshTick, setRefreshTick] = useState(0);
  const [state, setState] = useState<{
    status: "loading" | "ok" | "error";
    data: LiveFlightPosition[];
    error: string | null;
  }>({ status: "loading", data: [], error: null });

  useEffect(() => {
    let cancelled = false;

    fetch("/api/flights/live", { cache: "no-store" })
      .then((res) => res.json().then((json: ApiResponse) => ({ res, json })))
      .then(({ res, json }) => {
        if (cancelled) return;
        if (!res.ok) {
          setState({ status: "error", data: [], error: json.error ?? `Request failed: ${res.status}` });
          return;
        }
        setState({ status: "ok", data: Array.isArray(json.data) ? json.data : [], error: null });
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : "Failed to load";
        setState({ status: "error", data: [], error: message });
      });

    return () => { cancelled = true; };
  }, [refreshTick]);

  const handleRefresh = () => {
    setState((s) => ({ ...s, status: "loading", error: null }));
    setRefreshTick((n) => n + 1);
  };

  if (state.status === "loading") {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading live flights…</p>
        </CardContent>
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">{state.error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={handleRefresh}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const flights = state.data;
  const hasPositions = flights.some((f) => typeof f.lat === "number" && typeof f.lon === "number");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Live flights</CardTitle>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasPositions && <LiveFlightsMap flights={flights} />}
          {flights.length === 0 ? (
            <p className="text-muted-foreground">No flights in the selected area.</p>
          ) : (
          <ul className="space-y-3">
            {flights.slice(0, 100).map((f, i) => (
              <li
                key={f.fr24_id ?? f.hex ?? i}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-border pb-2 last:border-0"
              >
                <span className="font-medium">{f.flight ?? f.callsign ?? "—"}</span>
                {f.reg && <span className="text-muted-foreground text-sm">({f.reg})</span>}
                {f.orig_iata && f.dest_iata && (
                  <span className="text-sm">
                    {f.orig_iata} → {f.dest_iata}
                  </span>
                )}
                {f.alt != null && (
                  <span className="text-muted-foreground text-sm">FL{Math.round(f.alt / 100)}</span>
                )}
                {f.gspeed != null && (
                  <span className="text-muted-foreground text-sm">{f.gspeed} kt</span>
                )}
              </li>
            ))}
          </ul>
        )}
        {flights.length > 100 && (
          <p className="text-muted-foreground mt-2 text-sm">Showing first 100 of {flights.length}.</p>
        )}
        </CardContent>
      </Card>
    </div>
  );
}

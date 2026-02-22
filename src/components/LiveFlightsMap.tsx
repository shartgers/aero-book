"use client";

import { useEffect, useState, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { LiveFlightPosition } from "./LiveFlightsList";

/** Track point from FR24 flight-tracks API (lat/lon or latitude/longitude). */
interface TrackPoint {
  lat?: number;
  lon?: number;
  latitude?: number;
  longitude?: number;
  [key: string]: unknown;
}

// Plane icon for flight markers (replaces default map pin).
const planeIcon = L.divIcon({
  className: "plane-marker",
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.5c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2l-1.8-8.2L17.8 19.2z"/></svg>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12],
});
L.Marker.prototype.options.icon = planeIcon;

/** Fits map bounds to include positions and optional track. */
function FitBounds({
  positions,
  trackPositions,
  dataKey,
}: {
  positions: [number, number][];
  trackPositions: [number, number][];
  dataKey: string;
}) {
  const map = useMap();
  const allPoints = useMemo(
    () => (trackPositions.length > 0 ? [...positions, ...trackPositions] : positions),
    [positions, trackPositions]
  );
  useEffect(() => {
    if (allPoints.length === 0) return;
    if (allPoints.length === 1) {
      map.setView(allPoints[0], 8);
      return;
    }
    map.fitBounds(L.latLngBounds(allPoints), { padding: [24, 24], maxZoom: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only refit when dataKey changes
  }, [map, dataKey]);
  return null;
}

interface LiveFlightsMapProps {
  flights: LiveFlightPosition[];
}

/** Convert API track points to [lat, lon][] for Leaflet. */
function trackToPositions(tracks: TrackPoint[]): [number, number][] {
  return tracks
    .map((pt) => {
      const lat = pt.lat ?? pt.latitude;
      const lon = pt.lon ?? pt.longitude;
      if (typeof lat === "number" && typeof lon === "number") return [lat, lon] as [number, number];
      return null;
    })
    .filter((p): p is [number, number] => p !== null);
}

/** Sandbox fallback: known coords for ARN (Stockholm) and FUE (Fuerteventura) so the route line always shows. */
const SANDBOX_ROUTE: Record<string, [number, number]> = {
  ARN: [59.6519, 17.9186],
  FUE: [28.4527, -13.8638],
};

/**
 * Renders a Leaflet map with one marker per flight (lat/lon) and optional flight route polyline.
 * Fetches track for the first flight with fr24_id (sandbox returns static route).
 */
export function LiveFlightsMap({ flights }: LiveFlightsMapProps) {
  const withPosition = flights.filter(
    (f): f is LiveFlightPosition & { lat: number; lon: number } =>
      typeof f.lat === "number" && typeof f.lon === "number"
  );
  const positions: [number, number][] = withPosition.map((f) => [f.lat, f.lon]);
  const center: [number, number] =
    positions.length > 0
      ? [
          positions.reduce((s, p) => s + p[0], 0) / positions.length,
          positions.reduce((s, p) => s + p[1], 0) / positions.length,
        ]
      : [50, 10];
  const dataKey = `${flights.length}-${withPosition[0]?.timestamp ?? ""}`;

  const [rawTrackPositions, setRawTrackPositions] = useState<[number, number][]>([]);
  const firstFlight = withPosition[0];
  const firstFr24Id = firstFlight?.fr24_id;
  const hasFirstFlight = !!firstFlight && typeof firstFlight.lat === "number" && typeof firstFlight.lon === "number";
  const trackPositions = hasFirstFlight ? rawTrackPositions : [];

  useEffect(() => {
    if (!firstFlight || typeof firstFlight.lat !== "number" || typeof firstFlight.lon !== "number") {
      return;
    }
    let cancelled = false;

    // 1. Try flight-tracks API first (full route from FR24).
    fetch(`/api/flights/tracks?flight_id=${encodeURIComponent(firstFr24Id ?? "")}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((json: { data?: Array<{ tracks?: TrackPoint[] }>; error?: string }) => {
        if (cancelled) return;
        if (!json.error && Array.isArray(json.data) && json.data.length > 0) {
          const tracks = json.data[0]?.tracks ?? [];
          const pts = trackToPositions(tracks);
          if (pts.length > 1) {
            setRawTrackPositions(pts);
            return;
          }
        }
        // 2. Fallback: try API (origin → current → destination), then hardcoded sandbox route.
        const origIata = firstFlight.orig_iata;
        const destIata = firstFlight.dest_iata;
        const origIcao = firstFlight.orig_icao ?? origIata;
        const destIcao = firstFlight.dest_icao ?? destIata;
        const currentPos: [number, number] = [firstFlight.lat, firstFlight.lon];

        const tryFallbackApi = () => {
          if (!origIcao || !destIcao) return;
          const params = new URLSearchParams({
            lat: String(firstFlight.lat),
            lon: String(firstFlight.lon),
          });
          if (origIata) params.set("orig_iata", origIata);
          else params.set("orig_icao", origIcao);
          if (destIata) params.set("dest_iata", destIata);
          else params.set("dest_icao", destIcao);
          fetch(`/api/flights/route-fallback?${params}`, { cache: "no-store" })
            .then((r) => r.json())
            .then((fallback: { positions?: [number, number][]; error?: string }) => {
              if (!cancelled && !fallback.error && Array.isArray(fallback.positions) && fallback.positions.length > 1) {
                setRawTrackPositions(fallback.positions);
              } else {
                trySandboxRoute();
              }
            })
            .catch(() => trySandboxRoute());
        };

        const trySandboxRoute = () => {
          if (cancelled) return;
          const o = origIata && SANDBOX_ROUTE[origIata];
          const d = destIata && SANDBOX_ROUTE[destIata];
          if (o && d) {
            setRawTrackPositions([o, currentPos, d]);
          }
        };

        if (origIcao && destIcao) {
          tryFallbackApi();
        } else {
          trySandboxRoute();
        }
      })
      .catch(() => {
        if (cancelled) return;
        const origIata = firstFlight.orig_iata;
        const destIata = firstFlight.dest_iata;
        const currentPos: [number, number] = [firstFlight.lat, firstFlight.lon];
        const o = origIata && SANDBOX_ROUTE[origIata];
        const d = destIata && SANDBOX_ROUTE[destIata];
        if (o && d) setRawTrackPositions([o, currentPos, d]);
      });
    return () => {
      cancelled = true;
    };
  }, [firstFr24Id, firstFlight?.lat, firstFlight?.lon, firstFlight?.orig_icao, firstFlight?.dest_icao, firstFlight?.orig_iata, firstFlight?.dest_iata]);

  return (
    <div className="h-[320px] w-full rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={center}
        zoom={5}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds
          positions={positions}
          trackPositions={trackPositions}
          dataKey={`${dataKey}-${trackPositions.length}`}
        />
        {trackPositions.length > 1 && (
          <Polyline
            positions={trackPositions}
            pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.9 }}
          />
        )}
        {withPosition.map((f, i) => (
          <Marker key={f.fr24_id ?? f.hex ?? i} position={[f.lat, f.lon]}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{f.flight ?? f.callsign ?? "—"}</div>
                {f.reg && <div className="text-muted-foreground">{f.reg}</div>}
                {f.orig_iata && f.dest_iata && (
                  <div>
                    {f.orig_iata} → {f.dest_iata}
                  </div>
                )}
                {f.alt != null && <div>FL{Math.round(f.alt / 100)}</div>}
                {f.gspeed != null && <div>{f.gspeed} kt</div>}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

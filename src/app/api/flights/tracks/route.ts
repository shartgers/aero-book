/**
 * Proxies Flightradar24 flight tracks (route/path) for a single flight.
 * Uses @flightradar24/fr24sdk client.flightTracks.get(flight_id).
 * See: https://fr24api.flightradar24.com/docs/endpoints/overview (Flight tracks)
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import SDK from "@flightradar24/fr24sdk";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiToken =
    process.env.FR24_API_KEY ||
    process.env.FR24_SANDBOX_API_KEY ||
    process.env.FR24_API_TOKEN;
  if (!apiToken) {
    return NextResponse.json(
      { error: "Flightradar24 API key not configured" },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const flightId = searchParams.get("flight_id");
  if (!flightId || flightId.trim() === "") {
    return NextResponse.json(
      { error: "flight_id query parameter is required" },
      { status: 400 }
    );
  }

  const client = new SDK.Client({ apiToken, apiVersion: "v1" });

  try {
    const response = await client.flightTracks.get(flightId.trim());
    // SDK returns FlightTracksResponse with .data = array of { fr24_id, tracks }.
    const data = Array.isArray(response.data)
      ? response.data.map((item) => ({
          fr24_id: item.fr24_id,
          tracks: (item.tracks || []).map((pt) => ({ ...(pt as Record<string, unknown>) })),
        }))
      : [];
    return NextResponse.json({ data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch flight tracks: ${message}` },
      { status: 502 }
    );
  } finally {
    client.close();
  }
}

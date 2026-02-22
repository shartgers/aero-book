/**
 * Proxies Flightradar24 live flight positions (full) to the client.
 * Uses the official @flightradar24/fr24sdk; same endpoint as docs:
 * https://fr24api.flightradar24.com/docs/endpoints/overview
 *
 * API key is kept server-side; callers must be authenticated.
 * Optional query: bounds (N,S,W,E comma-separated, e.g. 51.6,51.4,-0.3,-0.1 for London area).
 */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import SDK from "@flightradar24/fr24sdk";

export const dynamic = "force-dynamic";

// Default bounds: broad Europe (sandbox ignores bounds and returns static data anyway).
const DEFAULT_BOUNDS = "71.0,35.0,-11.0,42.0";

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
  const bounds = searchParams.get("bounds") ?? DEFAULT_BOUNDS;

  const client = new SDK.Client({
    apiToken,
    apiVersion: "v1",
  });

  try {
    const positions = await client.live.getFull({ bounds });
    // SDK returns array of FlightPositions instances (plain-object-like); serialize for JSON.
    const data = Array.isArray(positions)
      ? positions.map((p) => ({ ...(p as Record<string, unknown>) }))
      : [];
    return NextResponse.json({ data });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    const status =
      e && typeof e === "object" && "status" in e && typeof (e as { status: number }).status === "number"
        ? (e as { status: number }).status
        : 502;
    return NextResponse.json(
      { error: `Failed to fetch live flights: ${message}` },
      { status: status >= 400 && status < 600 ? status : 502 }
    );
  } finally {
    client.close();
  }
}

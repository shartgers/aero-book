/**
 * Fallback route: returns a simple 3-point polyline (origin → current position → destination)
 * when the flight-tracks API returns no data (e.g. sandbox). Uses FR24 airports API for coords.
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
  // FR24 static airports API accepts IATA (e.g. ARN); prefer over ICAO.
  const origCode = searchParams.get("orig_iata")?.trim() || searchParams.get("orig_icao")?.trim();
  const destCode = searchParams.get("dest_iata")?.trim() || searchParams.get("dest_icao")?.trim();
  const latStr = searchParams.get("lat");
  const lonStr = searchParams.get("lon");

  if (!origCode || !destCode || latStr == null || lonStr == null) {
    return NextResponse.json(
      { error: "orig_iata/orig_icao, dest_iata/dest_icao, lat and lon query parameters are required" },
      { status: 400 }
    );
  }

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return NextResponse.json({ error: "lat and lon must be numbers" }, { status: 400 });
  }

  const client = new SDK.Client({ apiToken, apiVersion: "v1" });

  try {
    const [originAirport, destAirport] = await Promise.all([
      client.airports.getFull(origCode),
      client.airports.getFull(destCode),
    ]);

    const originLat = originAirport?.lat ?? originAirport?.latitude;
    const originLon = originAirport?.lon ?? originAirport?.longitude;
    const destLat = destAirport?.lat ?? destAirport?.latitude;
    const destLon = destAirport?.lon ?? destAirport?.longitude;

    if (
      typeof originLat !== "number" ||
      typeof originLon !== "number" ||
      typeof destLat !== "number" ||
      typeof destLon !== "number"
    ) {
      return NextResponse.json(
        { error: "Could not resolve airport coordinates" },
        { status: 404 }
      );
    }

    const positions: [number, number][] = [
      [originLat, originLon],
      [lat, lon],
      [destLat, destLon],
    ];
    return NextResponse.json({ positions });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to build route: ${message}` },
      { status: 502 }
    );
  } finally {
    client.close();
  }
}

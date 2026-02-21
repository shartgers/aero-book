import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { aircraft, squawks } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [craft] = await db
    .select()
    .from(aircraft)
    .where(eq(aircraft.id, id));

  if (!craft) {
    return NextResponse.json({ error: "Aircraft not found" }, { status: 404 });
  }

  const openSquawks = await db
    .select()
    .from(squawks)
    .where(
      eq(squawks.aircraftId, id)
    )
    .then((rows) => rows.filter((s) => s.status !== "resolved"));

  return NextResponse.json({ ...craft, squawks: openSquawks });
}

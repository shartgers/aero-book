export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { techLogEntries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse, NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: aircraftId } = await params;

  const entries = await db
    .select()
    .from(techLogEntries)
    .where(eq(techLogEntries.aircraftId, aircraftId))
    .orderBy(desc(techLogEntries.entryDate));

  return NextResponse.json(entries);
}

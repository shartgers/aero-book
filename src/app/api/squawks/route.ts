import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { squawks } from "@/db/schema";
import { eq, and, ne, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const aircraftId = searchParams.get("aircraftId");

  const conditions = [ne(squawks.status, "resolved")];
  if (aircraftId) {
    conditions.push(eq(squawks.aircraftId, aircraftId));
  }

  const results = await db
    .select()
    .from(squawks)
    .where(and(...conditions))
    .orderBy(desc(squawks.createdAt));

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { aircraftId, title, description, severity } = body;

  if (!aircraftId || !title || !description || !severity) {
    return NextResponse.json({ error: "Missing required fields: aircraftId, title, description, severity" }, { status: 400 });
  }

  const [created] = await db
    .insert(squawks)
    .values({
      aircraftId,
      title,
      description,
      severity,
      reportedBy: session.user.id,
      status: "open",
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

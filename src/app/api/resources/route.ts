export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { resources, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

const VALID_TYPES = ["aircraft", "simulator", "classroom"] as const;

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db.select().from(resources).where(eq(resources.isActive, true));
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getUserRole(session.user.id);
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { type, name, capacity, hourlyRate, aircraftId } = body;

  if (!type || !name) {
    return NextResponse.json({ error: "type and name are required" }, { status: 400 });
  }

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "type must be one of: aircraft, simulator, classroom" }, { status: 400 });
  }

  const [row] = await db.insert(resources).values({
    type,
    name,
    capacity: capacity ?? 1,
    hourlyRate: hourlyRate != null ? String(hourlyRate) : null,
    aircraftId: aircraftId ?? null,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}

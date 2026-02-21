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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const [row] = await db.select().from(resources).where(eq(resources.id, id));
  if (!row) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  return NextResponse.json(row);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getUserRole(session.user.id);
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const [existing] = await db.select().from(resources).where(eq(resources.id, id));
  if (!existing) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

  const body = await request.json();
  const updates: Record<string, unknown> = {};

  if (body.name !== undefined) updates.name = body.name;
  if (body.capacity !== undefined) updates.capacity = body.capacity;
  if (body.hourlyRate !== undefined) updates.hourlyRate = String(body.hourlyRate);
  if (body.isActive !== undefined) updates.isActive = body.isActive;

  updates.updatedAt = new Date();

  const [updated] = await db.update(resources).set(updates).where(eq(resources.id, id)).returning();
  return NextResponse.json(updated);
}

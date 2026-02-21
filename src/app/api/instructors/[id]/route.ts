import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { instructors, users, instructorAvailability } from "@/db/schema";
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

  const results = await db
    .select({
      id: instructors.id,
      userId: instructors.userId,
      qualifications: instructors.qualifications,
      hourlyRate: instructors.hourlyRate,
      bio: instructors.bio,
      isActive: instructors.isActive,
      createdAt: instructors.createdAt,
      updatedAt: instructors.updatedAt,
      userName: users.name,
      userEmail: users.email,
    })
    .from(instructors)
    .innerJoin(users, eq(users.id, instructors.userId))
    .where(eq(instructors.id, id));

  if (!results.length) {
    return NextResponse.json({ error: "Instructor not found" }, { status: 404 });
  }

  const availability = await db
    .select()
    .from(instructorAvailability)
    .where(eq(instructorAvailability.instructorId, id));

  return NextResponse.json({ ...results[0], availability });
}

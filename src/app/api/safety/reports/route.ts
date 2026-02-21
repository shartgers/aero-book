export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { safetyReports, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { ensureNeonAuthUserInAppDb } from "@/lib/ensure-user";
import { NextResponse } from "next/server";

const VALID_CATEGORIES = ["airprox", "runway_incursion", "bird_strike", "technical_fault", "near_miss", "other"] as const;
const VALID_SEVERITIES = ["hazard", "incident", "serious_incident", "accident"] as const;

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const role = await getUserRole(userId);
  const rows = await db.select().from(safetyReports)
    .where(eq(safetyReports.reportedBy, userId))
    .orderBy(desc(safetyReports.createdAt));

  const sanitised = rows.map(r => {
    if (r.isAnonymous && role !== "admin") {
      const { reportedBy: _reportedBy, ...rest } = r;
      return rest;
    }
    return r;
  });

  return NextResponse.json(sanitised);
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  await ensureNeonAuthUserInAppDb(session.user);

  const body = await request.json();
  const { category, severity, description, dateOfOccurrence, location, aircraftId, isAnonymous } = body;

  if (!category || !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!severity || !VALID_SEVERITIES.includes(severity)) {
    return NextResponse.json({ error: "Invalid severity" }, { status: 400 });
  }
  if (!description) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }
  if (!dateOfOccurrence) {
    return NextResponse.json({ error: "Date of occurrence is required" }, { status: 400 });
  }

  const [inserted] = await db.insert(safetyReports).values({
    reportedBy: userId,
    isAnonymous: isAnonymous ?? false,
    category,
    severity,
    description,
    dateOfOccurrence: new Date(dateOfOccurrence),
    location: location ?? null,
    aircraftId: aircraftId ?? null,
  }).returning({ id: safetyReports.id });

  return NextResponse.json({ id: inserted.id, message: "Safety report submitted" }, { status: 201 });
}

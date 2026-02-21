import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { certificates } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await db
    .select()
    .from(certificates)
    .where(eq(certificates.userId, session.user.id))
    .orderBy(asc(certificates.expiryDate));

  return NextResponse.json(results);
}

export async function POST(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, expiryDate, documentUrl } = body;

  if (!type || !expiryDate) {
    return NextResponse.json({ error: "Missing required fields: type, expiryDate" }, { status: 400 });
  }

  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) {
    return NextResponse.json({ error: "Invalid date format for expiryDate" }, { status: 400 });
  }

  const [created] = await db
    .insert(certificates)
    .values({
      userId: session.user.id,
      type,
      expiryDate: expiry,
      documentUrl: documentUrl ?? null,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

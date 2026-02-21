export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { documents } from "@/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ensureNeonAuthUserInAppDb } from "@/lib/ensure-user";

const VALID_CATEGORIES = [
  "licence", "medical", "rating", "type_rating", "insurance",
  "club_agreement", "notam", "sop", "arc", "other",
] as const;

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  const rows = await db
    .select()
    .from(documents)
    .where(or(eq(documents.userId, userId), eq(documents.isClubWide, true)))
    .orderBy(desc(documents.createdAt));

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = session.user.id;

  await ensureNeonAuthUserInAppDb(session.user);

  const body = await request.json();
  const { title, category, fileUrl, mimeType, expiryDate } = body;

  if (!title || !category || !fileUrl || !mimeType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const [doc] = await db
    .insert(documents)
    .values({
      userId,
      title,
      category,
      fileUrl,
      mimeType,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isClubWide: false,
      uploadedBy: userId,
    })
    .returning();

  return NextResponse.json(doc, { status: 201 });
}

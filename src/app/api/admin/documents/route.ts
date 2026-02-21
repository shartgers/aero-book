export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { documents, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { ensureNeonAuthUserInAppDb } from "@/lib/ensure-user";

const VALID_CATEGORIES = [
  "licence", "medical", "rating", "type_rating", "insurance",
  "club_agreement", "notam", "sop", "arc", "other",
] as const;

async function getUserRole(userId: string) {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
  return u?.role ?? "member";
}

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = await getUserRole(session.user.id);
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rows = await db
    .select({ doc: documents, ownerName: users.name })
    .from(documents)
    .leftJoin(users, eq(documents.userId, users.id))
    .orderBy(desc(documents.createdAt));

  return NextResponse.json(rows.map((r) => ({ ...r.doc, ownerName: r.ownerName })));
}

export async function POST(request: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureNeonAuthUserInAppDb(session.user);

  const role = await getUserRole(session.user.id);
  if (role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { title, category, fileUrl, mimeType, expiryDate, isClubWide, userId } = body;

  if (!title || !category || !fileUrl || !mimeType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }

  const [doc] = await db
    .insert(documents)
    .values({
      userId: isClubWide ? null : (userId ?? session.user.id),
      title,
      category,
      fileUrl,
      mimeType,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isClubWide: isClubWide ?? false,
      uploadedBy: session.user.id,
    })
    .returning();

  return NextResponse.json(doc, { status: 201 });
}

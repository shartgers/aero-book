import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { db } from "@/db/index";
import { certificates, users } from "@/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, session.user.id));
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const expiringSoon = searchParams.get("expiringSoon") === "true";

  let query = db
    .select({
      id: certificates.id,
      userId: certificates.userId,
      userName: users.name,
      userEmail: users.email,
      type: certificates.type,
      expiryDate: certificates.expiryDate,
      documentUrl: certificates.documentUrl,
      isVerified: certificates.isVerified,
      createdAt: certificates.createdAt,
      updatedAt: certificates.updatedAt,
    })
    .from(certificates)
    .innerJoin(users, eq(users.id, certificates.userId))
    .$dynamic();

  if (expiringSoon) {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    query = query.where(
      and(
        gte(certificates.expiryDate, now),
        lte(certificates.expiryDate, thirtyDaysFromNow)
      )
    );
  }

  const results = await query;

  return NextResponse.json(results);
}

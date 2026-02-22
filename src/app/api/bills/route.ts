import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { getBillsForUser } from "@/lib/bills-data";

export const dynamic = "force-dynamic";

/**
 * Returns bills for the current user. Uses shared getBillsForUser so logic
 * matches the bills page (same session context; no internal fetch 401s).
 */
export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await getBillsForUser(session.user);
  return NextResponse.json(results);
}

/**
 * Handles erroneous requests to /api/auth/display-name/value-of and
 * /api/auth/display-name/to-string. These 404s occur when the Neon Auth
 * client (or a dependency) builds a URL from a display-name value that is
 * an object; JavaScript then coerces it to string via .valueOf or .toString,
 * producing these path segments. Returning a safe response prevents console 404s.
 */
import { NextRequest, NextResponse } from "next/server";

const ALLOWED = new Set(["value-of", "to-string"]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ method: string }> }
) {
  const { method } = await params;
  if (!ALLOWED.has(method)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ displayName: "" });
}

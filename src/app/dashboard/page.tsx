import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ExpiryWarningBanner } from "@/components/ExpiryWarningBanner";
import { ensureNeonAuthUserInAppDb } from "@/lib/ensure-user";

export const dynamic = "force-dynamic";

interface Certificate {
  id: string;
  type: string;
  expiryDate: string;
  verified: boolean;
}

export default async function DashboardPage() {
  const { data: session } = await auth.getSession();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  // Sync Neon Auth user into public.users so role, bookings, bills, etc. work.
  // Without this, users who only visit the dashboard never get a row (role is stored here).
  await ensureNeonAuthUserInAppDb(session.user);

  let certificates: Certificate[] = [];
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/certificates`, { cache: "no-store" });
    if (res.ok) {
      certificates = await res.json();
    }
  } catch {
    // API may not be available yet
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4">
      {certificates.length > 0 && (
        <div className="w-full max-w-md">
          <ExpiryWarningBanner certificates={certificates} />
        </div>
      )}
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome, {session.user.name ?? session.user.email}
      </p>
      <nav className="flex flex-wrap justify-center gap-3">
        <Link
          href="/aircraft"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Fleet
        </Link>
        <Link
          href="/bookings"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Bookings
        </Link>
        <Link
          href="/bills"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          My Bills
        </Link>
      </nav>
      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/account/certificates"
          className="text-sm text-muted-foreground underline"
        >
          Certificates
        </Link>
        <Link
          href="/account/notifications"
          className="text-sm text-muted-foreground underline"
        >
          Notifications
        </Link>
        <Link
          href="/auth/sign-out"
          className="text-sm text-muted-foreground underline"
        >
          Sign out
        </Link>
        <Link
          href="/account/settings"
          className="text-sm text-muted-foreground underline"
        >
          Account settings
        </Link>
      </div>
    </div>
  );
}

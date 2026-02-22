import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { ExpiryWarningBanner } from "@/components/ExpiryWarningBanner";
import { ensureNeonAuthUserInAppDb } from "@/lib/ensure-user";
import { getCertificatesForUser } from "@/lib/certificates-data";
import { LiveFlightsList } from "@/components/LiveFlightsList";

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

  // Use shared data layer in same request context so auth session is valid (no internal fetch 401s).
  // Use shared data layer in same request context so auth session is valid (no internal fetch 401s).
  // Map DB shape (isVerified, Date) to Certificate shape (verified, expiryDate string) for ExpiryWarningBanner.
  const raw = await getCertificatesForUser(session.user.id);
  const certificates: Certificate[] = raw.map((c) => ({
    id: c.id,
    type: c.type,
    expiryDate: c.expiryDate instanceof Date ? c.expiryDate.toISOString().slice(0, 10) : String(c.expiryDate),
    verified: c.isVerified,
  }));

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
      <div className="w-full max-w-2xl mt-6">
        <LiveFlightsList />
      </div>
    </div>
  );
}

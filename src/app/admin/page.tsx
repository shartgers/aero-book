import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { users, aircraft, bookings } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import { ClubSettingsForm } from "@/components/ClubSettingsForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  // Check admin role
  const [dbUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.email, session.user.email));

  if (!dbUser || dbUser.role !== "admin") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">Admin Panel</h1>
        <p className="text-destructive">Access denied. You must be an admin to view this page.</p>
      </div>
    );
  }

  // Fetch current club settings (defaults if API not yet available)
  let clubSettings = {
    overlapWindowMinutes: 15,
    defaultBookingDurationMinutes: 60,
    maxBookingDurationHours: 4,
  };
  try {
    const settingsUrl = process.env.NEXT_PUBLIC_BASE_URL
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/api/settings`
      : "http://localhost:3000/api/settings";
    const settingsRes = await fetch(settingsUrl, { cache: "no-store" });
    if (settingsRes.ok) {
      clubSettings = await settingsRes.json();
    }
  } catch {
    // use defaults
  }

  const allAircraft = await db.select().from(aircraft);
  const recentBookings = await db
    .select()
    .from(bookings)
    .orderBy(desc(bookings.createdAt))
    .limit(20);
  const allUsers = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    createdAt: users.createdAt,
  }).from(users);

  // Fetch aircraft map for booking display
  const aircraftMap = new Map(allAircraft.map((ac) => [ac.id, ac]));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/analytics">Analytics</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/bills">Billing</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/certificates">Expiring Certs</Link>
          </Button>
        </div>
      </div>

      {/* Club Settings Section */}
      <section className="mb-10">
        <ClubSettingsForm initial={clubSettings} />
      </section>

      {/* Aircraft Section */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Aircraft</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-2 text-left font-medium">Tail Number</th>
                <th className="px-4 py-2 text-left font-medium">Type</th>
                <th className="px-4 py-2 text-left font-medium">Rate</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {allAircraft.map((ac) => (
                <tr key={ac.id} className="border-b">
                  <td className="px-4 py-2">
                    <Link href={`/aircraft/${ac.id}`} className="hover:underline">{ac.tailNumber}</Link>
                  </td>
                  <td className="px-4 py-2">{ac.type}</td>
                  <td className="px-4 py-2">${ac.hourlyRate}/hr</td>
                  <td className="px-4 py-2 capitalize">{ac.status}</td>
                </tr>
              ))}
              {allAircraft.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">No aircraft.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bookings Section */}
      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">Recent Bookings</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-2 text-left font-medium">Aircraft</th>
                <th className="px-4 py-2 text-left font-medium">Start</th>
                <th className="px-4 py-2 text-left font-medium">End</th>
                <th className="px-4 py-2 text-left font-medium">Status</th>
                <th className="px-4 py-2 text-left font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => {
                const ac = aircraftMap.get(b.aircraftId);
                return (
                  <tr key={b.id} className="border-b">
                    <td className="px-4 py-2">
                      {ac ? (
                        <Link href={`/aircraft/${ac.id}`} className="hover:underline">{ac.tailNumber}</Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-2">{new Date(b.startTime).toLocaleString()}</td>
                    <td className="px-4 py-2">{new Date(b.endTime).toLocaleString()}</td>
                    <td className="px-4 py-2"><BookingStatusBadge status={b.status} /></td>
                    <td className="px-4 py-2">{new Date(b.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {recentBookings.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-4 text-center text-muted-foreground">No bookings.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Users Section */}
      <section>
        <h2 className="mb-4 text-xl font-semibold">Users</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-2 text-left font-medium">Name</th>
                <th className="px-4 py-2 text-left font-medium">Email</th>
                <th className="px-4 py-2 text-left font-medium">Role</th>
                <th className="px-4 py-2 text-left font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.id} className="border-b">
                  <td className="px-4 py-2">{u.name ?? "—"}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2 capitalize">{u.role}</td>
                  <td className="px-4 py-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
              {allUsers.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">No users.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { NotificationPreferencesClient } from "@/components/NotificationPreferencesClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface NotificationPreferences {
  bookingReminders: boolean;
  waitlistNotifications: boolean;
  expiryReminders: boolean;
  billNotifications: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
}

const DEFAULTS: NotificationPreferences = {
  bookingReminders: true,
  waitlistNotifications: true,
  expiryReminders: true,
  billNotifications: true,
  emailEnabled: true,
  pushEnabled: false,
};

export default async function NotificationsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  let prefs: NotificationPreferences = DEFAULTS;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/notifications/preferences`, { cache: "no-store" });
    if (res.ok) {
      prefs = await res.json();
    }
  } catch {
    // use defaults
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">&larr; Back to dashboard</Link>
        </Button>
      </div>

      <h1 className="mb-6 text-2xl font-bold">Notification Preferences</h1>

      <NotificationPreferencesClient initial={prefs} />
    </div>
  );
}

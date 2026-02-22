/**
 * Account area layout: shared nav for Settings, Certificates, Documents, Notifications.
 * Notifications is reached from here (under Settings) instead of from the dashboard.
 */
import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { AccountNav } from "@/components/AccountNav";

export const dynamic = "force-dynamic";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <AccountNav />
      {children}
    </div>
  );
}

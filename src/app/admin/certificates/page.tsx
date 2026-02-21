import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { db } from "@/db/index";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface ExpiringCert {
  userName: string;
  type: string;
  expiryDate: string;
  daysRemaining: number;
  verified: boolean;
}

function expiryColor(days: number): string {
  if (days <= 0) return "text-red-700 dark:text-red-400 font-bold";
  if (days < 7) return "text-red-600 dark:text-red-400";
  if (days <= 30) return "text-amber-600 dark:text-amber-400";
  return "text-green-600 dark:text-green-400";
}

function expiryText(days: number): string {
  if (days <= 0) return "EXPIRED";
  return `${days}d`;
}

export default async function AdminCertificatesPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const [dbUser] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.email, session.user.email));

  if (!dbUser || dbUser.role !== "admin") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-4 text-2xl font-bold">Expiring Certificates</h1>
        <p className="text-destructive">Access denied. You must be an admin to view this page.</p>
      </div>
    );
  }

  let certs: ExpiringCert[] = [];
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/admin/certificates?expiringSoon=true`, { cache: "no-store" });
    if (res.ok) {
      certs = await res.json();
    }
  } catch {
    // API may not be available yet
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin">&larr; Back to admin</Link>
        </Button>
      </div>

      <h1 className="mb-6 text-2xl font-bold">Expiring Certificates</h1>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="px-4 py-2 text-left font-medium">Member</th>
              <th className="px-4 py-2 text-left font-medium">Type</th>
              <th className="px-4 py-2 text-left font-medium">Expiry Date</th>
              <th className="px-4 py-2 text-left font-medium">Days Left</th>
              <th className="px-4 py-2 text-left font-medium">Verified</th>
            </tr>
          </thead>
          <tbody>
            {certs.map((cert, i) => (
              <tr key={i} className="border-b">
                <td className="px-4 py-2">{cert.userName}</td>
                <td className="px-4 py-2 capitalize">{cert.type}</td>
                <td className="px-4 py-2">{new Date(cert.expiryDate).toLocaleDateString()}</td>
                <td className={cn("px-4 py-2", expiryColor(cert.daysRemaining))}>
                  {expiryText(cert.daysRemaining)}
                </td>
                <td className="px-4 py-2">
                  {cert.verified ? (
                    <span className="text-green-600">Verified</span>
                  ) : (
                    <span className="text-muted-foreground">Pending</span>
                  )}
                </td>
              </tr>
            ))}
            {certs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No expiring certificates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

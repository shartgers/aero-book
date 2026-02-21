import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CertificatesClient } from "@/components/CertificatesClient";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface Certificate {
  id: string;
  type: string;
  expiryDate: string;
  verified: boolean;
  documentUrl?: string | null;
}

export default async function CertificatesPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">&larr; Back to dashboard</Link>
        </Button>
      </div>

      <h1 className="mb-6 text-2xl font-bold">My Certificates</h1>

      <CertificatesClient initialCertificates={certificates} />
    </div>
  );
}

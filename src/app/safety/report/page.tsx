import { auth } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { SafetyReportForm } from "@/components/SafetyReportForm";

export const dynamic = "force-dynamic";

export default async function SafetyReportPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Submit Safety Report</h1>
      <SafetyReportForm />
    </div>
  );
}

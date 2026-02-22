import { redirect } from "next/navigation";

/**
 * Live flights are now on the dashboard. Redirect old links.
 */
export default function LiveFlightsPage() {
  redirect("/dashboard");
}

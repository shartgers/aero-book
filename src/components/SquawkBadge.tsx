import { cn } from "@/lib/utils";

const severityConfig = {
  cosmetic: { label: "Cosmetic", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
  operational: { label: "Operational", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  airworthiness: { label: "Airworthiness", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
} as const;

export function SquawkBadge({ severity }: { severity: "cosmetic" | "operational" | "airworthiness" }) {
  const config = severityConfig[severity];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}

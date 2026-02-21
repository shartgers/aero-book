import { cn } from "@/lib/utils";

const statusConfig = {
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  paid: { label: "Paid", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  disputed: { label: "Disputed", className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  refunded: { label: "Refunded", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
} as const;

export type BillStatus = keyof typeof statusConfig;

export function BillStatusBadge({ status }: { status: BillStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}

import { cn } from "@/lib/utils";

const statusConfig = {
  pre_booked: { label: "Pre-booked", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  pending: { label: "Pending", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  confirmed: { label: "Confirmed", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  dispatched: { label: "Dispatched", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
  checked_in: { label: "Checked In", className: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200" },
  in_progress: { label: "In Progress", className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200" },
  completed: { label: "Completed", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
} as const;

export function BookingStatusBadge({ status }: { status: "pre_booked" | "pending" | "confirmed" | "dispatched" | "checked_in" | "in_progress" | "completed" | "cancelled" }) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", config.className)}>
      {config.label}
    </span>
  );
}

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

type AircraftStatus = "available" | "maintenance" | "grounded";
type SquawkSeverity = "cosmetic" | "operational" | "airworthiness";

interface AircraftCardProps {
  id: string;
  tailNumber: string;
  type: string;
  hourlyRate: string;
  status: AircraftStatus;
  openSquawkCount: number;
  maxSquawkSeverity: SquawkSeverity | null;
  /** Optional aircraft photo URL (e.g. from airport-data.com lookup by tail number) */
  imageUrl?: string | null;
}

// Refined status pills: subtle, professional, with consistent typography
const statusBadge: Record<AircraftStatus, { label: string; className: string }> = {
  available: {
    label: "Available",
    className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/20 border border-emerald-500/20",
  },
  maintenance: {
    label: "Maintenance",
    className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:bg-amber-500/20 border border-amber-500/20",
  },
  grounded: {
    label: "Grounded",
    className: "bg-red-500/10 text-red-700 dark:text-red-400 dark:bg-red-500/20 border border-red-500/20",
  },
};

function squawkIndicatorColor(count: number, maxSeverity: SquawkSeverity | null): string {
  if (count === 0 || !maxSeverity) return "text-emerald-600 dark:text-emerald-400";
  if (maxSeverity === "airworthiness") return "text-red-600 dark:text-red-400";
  if (maxSeverity === "operational") return "text-amber-600 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

export function AircraftCard({
  id,
  tailNumber,
  type,
  hourlyRate,
  status,
  openSquawkCount,
  maxSquawkSeverity,
  imageUrl,
}: AircraftCardProps) {
  const badge = statusBadge[status];
  const squawkColor = squawkIndicatorColor(openSquawkCount, maxSquawkSeverity);

  return (
    <Link
      href={`/aircraft/${id}`}
      className="block group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-2xl"
    >
      <Card
        className={cn(
          "overflow-hidden flex flex-row p-0 gap-0",
          "rounded-2xl border border-border/80 shadow-sm",
          "transition-all duration-200 ease-out",
          "hover:shadow-lg hover:border-primary/25 hover:shadow-primary/5"
        )}
      >
        {/* Plane image — left, fixed size; rounded only on left to match card */}
        <div className="shrink-0 w-32 sm:w-36 h-32 sm:h-36 bg-muted/80 flex items-center justify-center overflow-hidden rounded-l-2xl border-r border-border/60">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={tailNumber}
              className="h-full w-full object-cover object-center transition-transform duration-200 group-hover:scale-105"
              sizes="144px"
            />
          ) : (
            <span className="text-muted-foreground/60 text-5xl" aria-hidden>
              ✈
            </span>
          )}
        </div>

        {/* Content — right side with clear hierarchy */}
        <div className="min-w-0 flex-1 flex flex-col py-4 pl-5 pr-4">
          <CardHeader className="p-0 pb-3">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-xl font-bold tracking-tight text-foreground truncate">
                {tailNumber}
              </CardTitle>
              <span
                className={cn(
                  "shrink-0 inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
                  badge.className
                )}
              >
                {badge.label}
              </span>
            </div>
            <CardDescription className="truncate text-sm mt-0.5">{type}</CardDescription>
          </CardHeader>

          <CardContent className="p-0 flex-1 flex flex-col justify-end">
            {/* Rate and squawks in a clean stats row */}
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <div>
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Rate</span>
                <p className="font-semibold text-foreground mt-0.5">${hourlyRate}/hr</p>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider">Squawks</span>
                <p className={cn("font-semibold mt-0.5", squawkColor)}>
                  {openSquawkCount} open
                </p>
              </div>
            </div>

            {/* Subtle CTA — view details with chevron */}
            <div className="mt-4 pt-4 border-t border-border/60 flex items-center justify-end gap-1 text-primary text-xs font-medium">
              <span>View details</span>
              <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}

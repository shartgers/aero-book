"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface DemandData {
  unfulfilledCount: number;
  unfulfilledByReason: { reason: string; count: number }[];
  peakHours: { dayOfWeek: number; hour: number; count: number }[];
  topUnfulfilledSlots: { date: string; hour: number; aircraftId: string; reason: string }[];
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS_START = 6;
const HOURS_END = 20;

function heatColor(count: number): string {
  if (count === 0) return "bg-muted";
  if (count <= 2) return "bg-blue-100 dark:bg-blue-900/40";
  if (count <= 4) return "bg-blue-300 dark:bg-blue-700/60";
  return "bg-blue-600 dark:bg-blue-500 text-white";
}

const reasonLabels: Record<string, string> = {
  full_fleet: "Full fleet",
  aircraft_grounded: "Aircraft grounded",
  no_instructor: "No instructor",
};

export function DemandPanel({ data }: { data: DemandData }) {
  const hours = Array.from({ length: HOURS_END - HOURS_START }, (_, i) => HOURS_START + i);

  // Build lookup: peakHours[day][hour] = count
  const heatMap = new Map<string, number>();
  for (const ph of data.peakHours) {
    heatMap.set(`${ph.dayOfWeek}-${ph.hour}`, ph.count);
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-sm">Total Unfulfilled</div>
            <div className="text-2xl font-bold">{data.unfulfilledCount}</div>
          </CardContent>
        </Card>
        {data.unfulfilledByReason.map((r) => (
          <Card key={r.reason}>
            <CardContent className="pt-6">
              <div className="text-muted-foreground text-sm">
                {reasonLabels[r.reason] ?? r.reason}
              </div>
              <div className="text-2xl font-bold">{r.count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Peak hours heatmap */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Peak Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="border-collapse text-xs">
              <thead>
                <tr>
                  <th className="px-2 py-1" />
                  {hours.map((h) => (
                    <th key={h} className="px-1 py-1 text-center font-medium text-muted-foreground">
                      {String(h).padStart(2, "0")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DAY_LABELS.map((day, dayIdx) => (
                  <tr key={day}>
                    <td className="px-2 py-1 font-medium text-muted-foreground">{day}</td>
                    {hours.map((h) => {
                      const count = heatMap.get(`${dayIdx}-${h}`) ?? 0;
                      return (
                        <td key={h} className="px-0 py-0">
                          <div
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-sm text-[10px] font-medium",
                              heatColor(count)
                            )}
                          >
                            {count > 0 ? count : ""}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-0.5">
              <div className="h-3 w-3 rounded-sm bg-muted" />
              <div className="h-3 w-3 rounded-sm bg-blue-100 dark:bg-blue-900/40" />
              <div className="h-3 w-3 rounded-sm bg-blue-300 dark:bg-blue-700/60" />
              <div className="h-3 w-3 rounded-sm bg-blue-600 dark:bg-blue-500" />
            </div>
            <span>More</span>
          </div>
        </CardContent>
      </Card>

      {/* Top unfulfilled slots */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Unfulfilled Slots</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topUnfulfilledSlots.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">None.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium">Date</th>
                    <th className="py-2 text-left font-medium">Hour</th>
                    <th className="py-2 text-left font-medium">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topUnfulfilledSlots.map((slot, i) => (
                    <tr key={i} className="border-b">
                      <td className="py-2">{new Date(slot.date).toLocaleDateString()}</td>
                      <td className="py-2">{String(slot.hour).padStart(2, "0")}:00</td>
                      <td className="py-2">{reasonLabels[slot.reason] ?? slot.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

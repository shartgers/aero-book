import { cn } from "@/lib/utils";

export interface UtilisationRow {
  tailNumber: string;
  type: string;
  utilisationRate: number;
  totalBookedHours: number;
  completedFlights: number;
  revenueTotal: number;
}

function rateColor(rate: number): string {
  if (rate < 0.2) return "bg-red-500";
  if (rate < 0.6) return "bg-amber-500";
  return "bg-green-500";
}

function rateTextColor(rate: number): string {
  if (rate < 0.2) return "text-red-600 dark:text-red-400";
  if (rate < 0.6) return "text-amber-600 dark:text-amber-400";
  return "text-green-600 dark:text-green-400";
}

export function UtilisationTable({ data }: { data: UtilisationRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="px-4 py-2 text-left font-medium">Aircraft</th>
            <th className="px-4 py-2 text-left font-medium">Type</th>
            <th className="px-4 py-2 text-left font-medium">Utilisation</th>
            <th className="px-4 py-2 text-right font-medium">Hours</th>
            <th className="px-4 py-2 text-right font-medium">Flights</th>
            <th className="px-4 py-2 text-right font-medium">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.tailNumber} className="border-b">
              <td className="px-4 py-2 font-medium">{row.tailNumber}</td>
              <td className="px-4 py-2">{row.type}</td>
              <td className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", rateColor(row.utilisationRate))}
                      style={{ width: `${Math.min(row.utilisationRate * 100, 100)}%` }}
                    />
                  </div>
                  <span className={cn("text-xs font-medium", rateTextColor(row.utilisationRate))}>
                    {(row.utilisationRate * 100).toFixed(0)}%
                  </span>
                </div>
              </td>
              <td className="px-4 py-2 text-right">{row.totalBookedHours.toFixed(1)}</td>
              <td className="px-4 py-2 text-right">{row.completedFlights}</td>
              <td className="px-4 py-2 text-right">&euro;{row.revenueTotal.toFixed(2)}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                No utilisation data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

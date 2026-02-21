"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface RevenueData {
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  byAircraft: { tailNumber: string; revenue: number }[];
  byMonth: { month: string; revenue: number }[];
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-muted-foreground text-sm">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

export function RevenuePanel({ data }: { data: RevenueData }) {
  const sortedByAircraft = [...data.byAircraft].sort((a, b) => b.revenue - a.revenue);
  const maxMonthly = Math.max(...data.byMonth.map((m) => m.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Revenue" value={`\u20AC${data.totalRevenue.toFixed(2)}`} />
        <StatCard label="Paid" value={`\u20AC${data.paidRevenue.toFixed(2)}`} />
        <StatCard label="Pending" value={`\u20AC${data.pendingRevenue.toFixed(2)}`} />
      </div>

      {/* By aircraft table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by Aircraft</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left font-medium">Aircraft</th>
                  <th className="py-2 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {sortedByAircraft.map((row) => (
                  <tr key={row.tailNumber} className="border-b">
                    <td className="py-2 font-medium">{row.tailNumber}</td>
                    <td className="py-2 text-right">&euro;{row.revenue.toFixed(2)}</td>
                  </tr>
                ))}
                {sortedByAircraft.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-muted-foreground">No data.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* By month bar chart (CSS-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue by Month</CardTitle>
        </CardHeader>
        <CardContent>
          {data.byMonth.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">No data.</p>
          ) : (
            <div className="space-y-2">
              {data.byMonth.map((row) => (
                <div key={row.month} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 text-xs text-muted-foreground">{row.month}</span>
                  <div className="flex-1 h-5 rounded bg-muted overflow-hidden">
                    <div
                      className="h-full rounded bg-primary"
                      style={{ width: `${(row.revenue / maxMonthly) * 100}%` }}
                    />
                  </div>
                  <span className="w-24 shrink-0 text-right text-xs font-medium">
                    &euro;{row.revenue.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

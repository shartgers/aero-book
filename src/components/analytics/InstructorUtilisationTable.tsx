export interface InstructorRow {
  name: string;
  hoursFlown: number;
  studentCount: number;
  flightCount: number;
}

export function InstructorUtilisationTable({ data }: { data: InstructorRow[] }) {
  const sorted = [...data].sort((a, b) => b.hoursFlown - a.hoursFlown);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 border-b">
            <th className="px-4 py-2 text-left font-medium">Instructor</th>
            <th className="px-4 py-2 text-right font-medium">Hours Flown</th>
            <th className="px-4 py-2 text-right font-medium">Students</th>
            <th className="px-4 py-2 text-right font-medium">Flights</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={row.name} className="border-b">
              <td className="px-4 py-2 font-medium">{row.name}</td>
              <td className="px-4 py-2 text-right">{row.hoursFlown.toFixed(1)}</td>
              <td className="px-4 py-2 text-right">{row.studentCount}</td>
              <td className="px-4 py-2 text-right">{row.flightCount}</td>
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                No instructor data available.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

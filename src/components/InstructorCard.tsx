import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InstructorCardProps {
  instructor: {
    id: string;
    userId: string;
    hourlyRate: string;
    bio: string | null;
    isActive: boolean;
    user: { name: string | null; email: string };
    qualifications: string[];
  };
  selected?: boolean;
  onSelect?: (id: string) => void;
}

export function InstructorCard({ instructor, selected, onSelect }: InstructorCardProps) {
  const { user, hourlyRate, bio, qualifications } = instructor;

  return (
    <Card
      className={cn(
        "cursor-pointer transition-shadow hover:shadow-md",
        selected && "ring-primary ring-2"
      )}
      onClick={() => onSelect?.(instructor.id)}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-base font-semibold">{user.name ?? user.email}</div>
            {bio && (
              <p className="text-muted-foreground mt-1 text-sm line-clamp-2">{bio}</p>
            )}
          </div>
          <div className="text-sm font-medium shrink-0">${hourlyRate}/hr</div>
        </div>
        {qualifications.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {qualifications.map((q) => (
              <span
                key={q}
                className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {q}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MAIN_NAV_ITEMS } from "@/lib/nav";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden" aria-label="Main navigation">
      <div className="flex items-center justify-around py-2">
        {MAIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-xs",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              {/* Explicit width/height prevent SVG from blowing up before Tailwind loads (FOUC). */}
              <svg
                className="h-5 w-5 shrink-0"
                width={20}
                height={20}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d={item.icon} />
              </svg>
              <span suppressHydrationWarning>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

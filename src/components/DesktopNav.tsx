"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MAIN_NAV_ITEMS } from "@/lib/nav";

/**
 * Horizontal main nav shown in the header on md+ screens.
 * Complements BottomNav (mobile-only); keeps the same links available on desktop.
 */
export function DesktopNav() {
  const pathname = usePathname();

  // Desktop-first: visible by default, hidden only below 768px so it always shows on wide screens
  return (
    <nav
      className="flex max-[767px]:hidden items-center gap-1"
      aria-label="Main navigation"
    >
      {MAIN_NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

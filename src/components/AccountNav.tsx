"use client";

/**
 * Subnav for account area: Settings, Certificates, Documents, Notifications.
 * Notifications lives here (under Settings) instead of on the dashboard.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items: { href: string; label: string }[] = [
  { href: "/account/settings", label: "Settings" },
  { href: "/account/certificates", label: "Certificates" },
  { href: "/account/documents", label: "Documents" },
  { href: "/account/notifications", label: "Notifications" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex flex-wrap gap-3 border-b border-border pb-4">
      {items.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "text-sm font-medium underline-offset-4 hover:underline",
            pathname === href
              ? "text-foreground underline"
              : "text-muted-foreground"
          )}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

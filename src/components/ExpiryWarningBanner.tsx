"use client";

import { useState } from "react";

interface Certificate {
  id: string;
  type: string;
  expiryDate: string;
  verified: boolean;
}

function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(dateStr);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function ExpiryWarningBanner({ certificates }: { certificates: Certificate[] }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const warnings: { type: string; days: number; expiryDate: string }[] = [];

  for (const cert of certificates) {
    if (cert.type !== "medical" && cert.type !== "license") continue;
    const days = daysUntil(cert.expiryDate);
    if (days <= 30) {
      warnings.push({ type: cert.type, days, expiryDate: cert.expiryDate });
    }
  }

  if (warnings.length === 0) return null;

  return (
    <div className="relative rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm dark:border-amber-700 dark:bg-amber-950">
      <button
        type="button"
        className="absolute right-2 top-2 text-amber-600 hover:text-amber-800 dark:text-amber-400"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
      >
        x
      </button>
      <div className="space-y-1">
        {warnings.map((w) => (
          <p key={`${w.type}-${w.expiryDate}`}>
            {w.days <= 0 ? (
              <span className="font-bold text-red-700 dark:text-red-400">
                Your {w.type} certificate expired on {new Date(w.expiryDate).toLocaleDateString()}. Booking is blocked until renewed.
              </span>
            ) : (
              <span className="text-amber-800 dark:text-amber-200">
                Your {w.type} certificate expires in {w.days} day{w.days !== 1 ? "s" : ""}.
              </span>
            )}
          </p>
        ))}
      </div>
    </div>
  );
}

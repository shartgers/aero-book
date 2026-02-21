"use client";

import { useState, useRef, useEffect } from "react";
import { BookingStatusBadge } from "@/components/BookingStatusBadge";
import Link from "next/link";

interface BookingSlotPopoverProps {
  booking: {
    id: string;
    aircraftTailNumber: string;
    startTime: string;
    endTime: string;
    status: "pre_booked" | "pending" | "confirmed" | "dispatched" | "checked_in" | "in_progress" | "completed" | "cancelled";
  };
}

export function BookingSlotPopover({ booking }: BookingSlotPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        className="hover:underline font-medium"
        onClick={() => setOpen(!open)}
      >
        Booked
      </button>
      {open && (
        <div className="absolute left-1/2 top-full z-10 mt-1 w-52 -translate-x-1/2 rounded-md border bg-popover p-3 shadow-md text-left text-sm">
          <div className="mb-1 font-semibold">{booking.aircraftTailNumber}</div>
          <div className="text-muted-foreground text-xs">
            {new Date(booking.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            {" - "}
            {new Date(booking.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <div className="mt-2">
            <BookingStatusBadge status={booking.status} />
          </div>
          <Link
            href={`/bookings/${booking.id}`}
            className="mt-2 block text-xs text-primary hover:underline"
          >
            View details
          </Link>
        </div>
      )}
    </div>
  );
}

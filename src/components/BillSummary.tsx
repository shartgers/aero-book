"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BillStatusBadge, type BillStatus } from "@/components/BillStatusBadge";
import { PaymentForm } from "@/components/PaymentForm";
import { DisputeForm } from "@/components/DisputeForm";

/** DB returns numeric columns as strings; accept both for display. */
interface BillSummaryProps {
  bill: {
    id: string;
    aircraftHours: number | string;
    aircraftCost: number | string;
    instructorHours?: number | string | null;
    instructorCost?: number | string | null;
    landingFees?: number | string | null;
    surcharges?: number | string | null;
    totalAmount: number | string;
    status: BillStatus;
  };
  showActions?: boolean;
}

/** Format currency for display; handles string from DB or number. */
function formatCurrency(v: number | string | null | undefined): string {
  const n = v == null ? 0 : Number(v);
  return Number.isNaN(n) ? "0.00" : n.toFixed(2);
}

/** Format hours for display. */
function formatHours(v: number | string | null | undefined): string {
  const n = v == null ? 0 : Number(v);
  return Number.isNaN(n) ? "0" : String(n);
}

export function BillSummary({ bill, showActions = true }: BillSummaryProps) {
  const [showPayment, setShowPayment] = useState(false);
  const [showDispute, setShowDispute] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(bill.status);

  const canPay = currentStatus === "pending";
  const canDispute = currentStatus === "pending";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Bill Summary</CardTitle>
            <BillStatusBadge status={currentStatus} />
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="py-2 text-muted-foreground">Aircraft ({formatHours(bill.aircraftHours)} hrs)</td>
                <td className="py-2 text-right font-medium">&euro;{formatCurrency(bill.aircraftCost)}</td>
              </tr>
              {bill.instructorHours != null && bill.instructorCost != null && (
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">Instructor ({formatHours(bill.instructorHours)} hrs)</td>
                  <td className="py-2 text-right font-medium">&euro;{formatCurrency(bill.instructorCost)}</td>
                </tr>
              )}
              {bill.landingFees != null && Number(bill.landingFees) > 0 && (
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">Landing fees</td>
                  <td className="py-2 text-right font-medium">&euro;{formatCurrency(bill.landingFees)}</td>
                </tr>
              )}
              {bill.surcharges != null && Number(bill.surcharges) > 0 && (
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">Surcharges</td>
                  <td className="py-2 text-right font-medium">&euro;{formatCurrency(bill.surcharges)}</td>
                </tr>
              )}
              <tr>
                <td className="py-2 font-semibold">Total</td>
                <td className="py-2 text-right font-semibold">&euro;{formatCurrency(bill.totalAmount)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
        {showActions && (canPay || canDispute) && (
          <CardFooter className="flex gap-3">
            {canPay && (
              <Button size="sm" onClick={() => { setShowPayment(true); setShowDispute(false); }}>
                Pay now
              </Button>
            )}
            {canDispute && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => { setShowDispute(true); setShowPayment(false); }}
              >
                Dispute this bill
              </Button>
            )}
          </CardFooter>
        )}
      </Card>

      {showPayment && canPay && (
        <PaymentForm
          billId={bill.id}
          amount={Number(bill.totalAmount)}
          onSuccess={() => { setCurrentStatus("paid"); setShowPayment(false); }}
        />
      )}

      {showDispute && canDispute && (
        <DisputeForm
          billId={bill.id}
          onSuccess={() => { setCurrentStatus("disputed"); setShowDispute(false); }}
        />
      )}
    </div>
  );
}

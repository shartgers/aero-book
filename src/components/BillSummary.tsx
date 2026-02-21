"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BillStatusBadge, type BillStatus } from "@/components/BillStatusBadge";
import { PaymentForm } from "@/components/PaymentForm";
import { DisputeForm } from "@/components/DisputeForm";

interface BillSummaryProps {
  bill: {
    id: string;
    aircraftHours: number;
    aircraftCost: number;
    instructorHours?: number | null;
    instructorCost?: number | null;
    landingFees?: number | null;
    surcharges?: number | null;
    totalAmount: number;
    status: BillStatus;
  };
  showActions?: boolean;
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
                <td className="py-2 text-muted-foreground">Aircraft ({bill.aircraftHours} hrs)</td>
                <td className="py-2 text-right font-medium">&euro;{bill.aircraftCost.toFixed(2)}</td>
              </tr>
              {bill.instructorHours != null && bill.instructorCost != null && (
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">Instructor ({bill.instructorHours} hrs)</td>
                  <td className="py-2 text-right font-medium">&euro;{bill.instructorCost.toFixed(2)}</td>
                </tr>
              )}
              {bill.landingFees != null && bill.landingFees > 0 && (
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">Landing fees</td>
                  <td className="py-2 text-right font-medium">&euro;{bill.landingFees.toFixed(2)}</td>
                </tr>
              )}
              {bill.surcharges != null && bill.surcharges > 0 && (
                <tr className="border-b">
                  <td className="py-2 text-muted-foreground">Surcharges</td>
                  <td className="py-2 text-right font-medium">&euro;{bill.surcharges.toFixed(2)}</td>
                </tr>
              )}
              <tr>
                <td className="py-2 font-semibold">Total</td>
                <td className="py-2 text-right font-semibold">&euro;{bill.totalAmount.toFixed(2)}</td>
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
          amount={bill.totalAmount}
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

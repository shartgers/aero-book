"use client";

// TODO: replace with Stripe Elements in production
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

interface PaymentFormProps {
  billId: string;
  amount: number;
  onSuccess: () => void;
}

export function PaymentForm({ billId, amount, onSuccess }: PaymentFormProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/bills/${billId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId: "pm_placeholder" }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error ?? "Payment failed.");
        setStatus("error");
        return;
      }

      setStatus("success");
      onSuccess();
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-green-600 font-medium">Payment successful.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="text-base">Payment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {/* TODO: replace with Stripe Elements */}
            Placeholder card form -- Stripe Elements will replace this in production.
          </p>
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input
              id="cardNumber"
              placeholder="4242 4242 4242 4242"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiry">Expiry</Label>
              <Input
                id="expiry"
                placeholder="MM/YY"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="cvc">CVC</Label>
              <Input
                id="cvc"
                placeholder="123"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                required
              />
            </div>
          </div>
          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={status === "submitting"} className="w-full">
            {status === "submitting" ? "Processing..." : `Pay \u20AC${amount.toFixed(2)}`}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

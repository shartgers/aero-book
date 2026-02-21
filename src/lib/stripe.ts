import Stripe from "stripe";

const STRIPE_API_VERSION = "2026-01-28.clover";

/** Lazy Stripe client. Only created at request time so build never needs STRIPE_SECRET_KEY. */
let _stripe: Stripe | null = null;

/**
 * Returns a Stripe client if STRIPE_SECRET_KEY is set. Use in API routes only;
 * do not call at module load so Next.js build can collect page data without env.
 */
export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!_stripe) {
    _stripe = new Stripe(key, { apiVersion: STRIPE_API_VERSION });
  }
  return _stripe;
}

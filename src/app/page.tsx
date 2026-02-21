import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconPlane() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconWrench() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function IconCreditCard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function IconBarChart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <IconCalendar />,
    title: "Aircraft Booking",
    description:
      "Real-time availability, conflict detection, and optional instructor pairing — all in one clean booking flow.",
  },
  {
    icon: <IconWrench />,
    title: "Squawk Tracking",
    description:
      "Log faults against specific aircraft. Open squawks automatically ground the plane until resolved.",
  },
  {
    icon: <IconCreditCard />,
    title: "Billing & Payments",
    description:
      "Invoices auto-generated from completed flights. Stripe-powered payments with member dispute resolution.",
  },
  {
    icon: <IconBarChart />,
    title: "Fleet Analytics",
    description:
      "Utilisation rates, demand heatmaps, revenue trends, and instructor performance — all in your admin panel.",
  },
];

const steps = [
  {
    number: "01",
    title: "Set up your club",
    description:
      "Add your aircraft, register instructors, and configure your settings in a few minutes.",
  },
  {
    number: "02",
    title: "Members book online",
    description:
      "A clean booking flow with live availability, instructor scheduling, and automatic conflict prevention.",
  },
  {
    number: "03",
    title: "Stay in control",
    description:
      "Track squawks, manage billing, and analyse fleet performance from your admin dashboard.",
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="flex flex-col">

      {/* ── Hero ── */}
      <section className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 px-4 py-20 text-white">
        {/* Subtle grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(to right,white 1px,transparent 1px),linear-gradient(to bottom,white 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative z-10 flex max-w-3xl flex-col items-center gap-6 text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium text-blue-100 backdrop-blur-sm">
            <IconPlane />
            Built for aero clubs managing 5–15 aircraft
          </span>

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
            Flight management,
            <br />
            <span className="text-blue-200">made simple</span>
          </h1>

          <p className="max-w-xl text-lg leading-relaxed text-blue-100 sm:text-xl">
            AeroBook handles aircraft booking, squawk tracking, billing, and
            fleet analytics — so your committee can focus on flying, not admin.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="bg-white font-semibold text-blue-700 shadow-lg hover:bg-blue-50"
            >
              <Link href="/auth/sign-up">Get started free</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
            >
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything your club needs
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              A lighter, purpose-built alternative to Private-Radar
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card
                key={feature.title}
                className="border-border/60 transition-shadow hover:shadow-md"
              >
                <CardHeader>
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-muted/40 px-4 py-24">
        <div className="mx-auto max-w-4xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Up and running in minutes
            </h2>
            <p className="mt-3 text-lg text-muted-foreground">
              No training required. No complex setup.
            </p>
          </div>

          <div className="grid gap-10 md:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step.number} className="relative flex flex-col gap-4">
                {/* Connector line between steps */}
                {i < steps.length - 1 && (
                  <div className="absolute top-6 left-12 hidden h-px w-[calc(100%+2.5rem)] bg-border md:block" />
                )}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {step.number}
                </div>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="px-4 py-28 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to take off?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Create your club account and start managing your fleet today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-blue-600 font-semibold text-white shadow-md hover:bg-blue-700"
            >
              <Link href="/auth/sign-up">Create your account</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/auth/sign-in">Already a member? Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t px-4 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span className="font-semibold text-foreground">AeroBook</span>
          <span>© {new Date().getFullYear()} AeroBook. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/auth/sign-in" className="transition-colors hover:text-foreground">
              Sign in
            </Link>
            <Link href="/auth/sign-up" className="transition-colors hover:text-foreground">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

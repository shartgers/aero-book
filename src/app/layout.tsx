import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { auth } from "@/lib/auth/server";
import { authClient } from "@/lib/auth/client";
import { NeonAuthUIProvider } from "@neondatabase/auth/react";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { BottomNav } from "@/components/BottomNav";
import { DesktopNav } from "@/components/DesktopNav";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/button";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AeroBook",
  description: "Flight association management for aero clubs",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: session } = await auth.getSession();
  const isLoggedIn = !!session?.user;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1d4ed8" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${isLoggedIn ? "pb-16 md:pb-0" : ""}`}
      >
        <ServiceWorkerRegistrar />
        {/* Type assertion needed: duplicate @better-fetch/fetch in node_modules causes authClient type to differ from provider expectation; runtime type is compatible */}
        <NeonAuthUIProvider authClient={authClient as Parameters<typeof NeonAuthUIProvider>[0]["authClient"]} redirectTo="/dashboard">
          <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background px-4">
            {isLoggedIn ? (
              <>
                <DesktopNav />
                <UserMenu />
              </>
            ) : (
              <>
                <Link href="/" className="text-lg font-semibold text-foreground">
                  AeroBook
                </Link>
                <nav className="flex items-center gap-3" aria-label="Sign in or sign up">
                  <Link
                    href="/auth/sign-in"
                    className="text-sm font-medium text-muted-foreground hover:text-foreground"
                  >
                    Log in
                  </Link>
                  <Button asChild size="sm">
                    <Link href="/auth/sign-up">Get started free</Link>
                  </Button>
                </nav>
              </>
            )}
          </header>
          {children}
          {isLoggedIn && <BottomNav />}
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}

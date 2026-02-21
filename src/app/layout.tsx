import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { authClient } from "@/lib/auth/client";
import { NeonAuthUIProvider, UserButton } from "@neondatabase/auth/react";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import { BottomNav } from "@/components/BottomNav";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1d4ed8" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased pb-16 md:pb-0`}
      >
        <ServiceWorkerRegistrar />
        {/* Type assertion needed: duplicate @better-fetch/fetch in node_modules causes authClient type to differ from provider expectation; runtime type is compatible */}
        <NeonAuthUIProvider authClient={authClient as Parameters<typeof NeonAuthUIProvider>[0]["authClient"]} redirectTo="/dashboard">
          <header className="flex h-16 items-center justify-end gap-4 p-4">
            <UserButton size="icon" />
          </header>
          {children}
          <BottomNav />
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}

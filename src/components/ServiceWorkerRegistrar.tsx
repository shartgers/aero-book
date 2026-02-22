"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker only in production (or when not on localhost).
 * Skipping registration in dev avoids stale cached HTML on first load — the SW
 * used to serve cache-first "/", causing an old/minimal page until manual refresh.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    if (isLocalhost) return;
    navigator.serviceWorker.register("/sw.js");
  }, []);
  return null;
}

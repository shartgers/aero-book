"use client";

import { useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

// NEXT_PUBLIC_VAPID_PUBLIC_KEY must be set in .env.local for push subscriptions
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const subscribe = () => () => {};
const getSnapshot = () => "serviceWorker" in navigator && "PushManager" in window;
const getServerSnapshot = () => false;

export function PushSubscribeButton() {
  const supported = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [status, setStatus] = useState<"idle" | "subscribing" | "subscribed" | "denied" | "error">("idle");

  async function handleSubscribe() {
    setStatus("subscribing");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!vapidKey) {
        setStatus("error");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const res = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      setStatus(res.ok ? "subscribed" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (!supported) {
    return <p className="text-sm text-muted-foreground">Push notifications are not supported in this browser.</p>;
  }

  if (status === "subscribed") {
    return <p className="text-sm text-green-600">Push notifications enabled.</p>;
  }

  if (status === "denied") {
    return <p className="text-sm text-amber-600">Notification permission was denied. Please enable it in browser settings.</p>;
  }

  return (
    <div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleSubscribe}
        disabled={status === "subscribing"}
      >
        {status === "subscribing" ? "Enabling..." : "Enable push notifications"}
      </Button>
      {status === "error" && (
        <p className="mt-1 text-sm text-red-600">Failed to enable push notifications.</p>
      )}
    </div>
  );
}

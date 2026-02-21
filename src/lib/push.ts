import webpush from "web-push";

// Lazy VAPID setup so build can load this module without env (setVapidDetails runs at request time).
let vapidConfigured = false;

function ensureVapidDetails(): boolean {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  if (!vapidConfigured) {
    webpush.setVapidDetails("mailto:admin@aerobook.app", publicKey, privateKey);
    vapidConfigured = true;
  }
  return true;
}

export async function sendPushNotification(
  subscription: object,
  payload: { title: string; body: string; url?: string }
) {
  if (!ensureVapidDetails()) {
    return; // Skip send when VAPID keys not configured (e.g. build or missing env)
  }
  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload)
    );
  } catch (err) {
    console.error("Push notification failed:", err);
  }
}

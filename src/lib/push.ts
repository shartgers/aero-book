import webpush from "web-push";

webpush.setVapidDetails(
  "mailto:admin@aerobook.app",
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function sendPushNotification(
  subscription: object,
  payload: { title: string; body: string; url?: string }
) {
  try {
    await webpush.sendNotification(
      subscription as webpush.PushSubscription,
      JSON.stringify(payload)
    );
  } catch (err) {
    console.error("Push notification failed:", err);
  }
}

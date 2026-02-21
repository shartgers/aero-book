"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PushSubscribeButton } from "@/components/PushSubscribeButton";

interface NotificationPreferences {
  bookingReminders: boolean;
  waitlistNotifications: boolean;
  expiryReminders: boolean;
  billNotifications: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
}

const TOGGLE_LABELS: { key: keyof NotificationPreferences; label: string }[] = [
  { key: "bookingReminders", label: "Booking reminders" },
  { key: "waitlistNotifications", label: "Waitlist notifications" },
  { key: "expiryReminders", label: "Expiry reminders" },
  { key: "billNotifications", label: "Bill notifications" },
  { key: "emailEnabled", label: "Email enabled" },
  { key: "pushEnabled", label: "Push notifications" },
];

export function NotificationPreferencesClient({ initial }: { initial: NotificationPreferences }) {
  const [prefs, setPrefs] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  async function updatePref(key: keyof NotificationPreferences, value: boolean) {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSaving(true);
    setSaveMsg("");

    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setSaveMsg(res.ok ? "Saved" : "Failed to save");
    } catch {
      setSaveMsg("Failed to save");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 2000);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Preferences</CardTitle>
            {saveMsg && (
              <span className={`text-xs ${saveMsg === "Saved" ? "text-green-600" : "text-red-600"}`}>
                {saveMsg}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {TOGGLE_LABELS.map(({ key, label }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium">{label}</span>
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) => updatePref(key, e.target.checked)}
                disabled={saving}
                className="h-4 w-4 rounded border-input"
              />
            </label>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Browser Push Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <PushSubscribeButton />
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import { SettingsForm } from "@/components/settings-form";
import { AiUsageStats } from "@/components/settings/ai-usage-stats";
import { PushNotificationSettings } from "@/components/settings/PushNotificationSettings";

export default function SettingsPage() {
  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold">Cài đặt</h1>
      <div className="mx-auto grid max-w-3xl gap-6">
        <SettingsForm />
        <AiUsageStats />
        <PushNotificationSettings />
      </div>
    </div>
  );
}
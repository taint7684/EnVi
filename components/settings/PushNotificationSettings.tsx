// Push Notification Settings Component
"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { createClient } from "@/lib/supabase/client";

export function PushNotificationSettings() {
  const { status, subscription, error, subscribe, unsubscribe, requestPermission } = usePushNotifications();
  const [isLoading, setIsLoading] = useState(false);
  const [dailyReminder, setDailyReminder] = useState(false);
  const [streakReminder, setStreakReminder] = useState(false);
  const [weeklyReport, setWeeklyReport] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (data) {
      setDailyReminder(data.daily_reminder);
      setStreakReminder(data.streak_reminder);
      setWeeklyReport(data.weekly_report);
    }
  }

  async function savePreference(key: string, value: boolean) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("user_notification_preferences")
      .upsert({
        user_id: user.id,
        [key]: value,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });
  }

  async function handleSubscribe() {
    setIsLoading(true);
    try {
      const permission = await requestPermission();
      if (permission !== "granted") {
        alert("Cần cấp quyền thông báo để nhận nhắc nhở");
        return;
      }
      await subscribe();
      await savePreference("daily_reminder", true);
      setDailyReminder(true);
    } catch (err) {
      console.error(err);
      alert("Không thể bật thông báo: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUnsubscribe() {
    setIsLoading(true);
    try {
      await unsubscribe();
      await savePreference("daily_reminder", false);
      setDailyReminder(false);
      setStreakReminder(false);
      setWeeklyReport(false);
    } catch (err) {
      console.error(err);
      alert("Không thể tắt thông báo: " + (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }

  const statusConfig = {
    unsupported: { label: "Không hỗ trợ", color: "text-muted-foreground", icon: BellOff },
    blocked: { label: "Đã chặn", color: "text-red-600", icon: AlertCircle },
    unsubscribed: { label: "Chưa bật", color: "text-amber-600", icon: BellOff },
    pending: { label: "Đang bật...", color: "text-blue-600", icon: Loader2 },
    subscribed: { label: "Đã bật", color: "text-emerald-600", icon: CheckCircle },
  };

  const currentConfig = statusConfig[status];
  const Icon = currentConfig.icon;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Bell className="size-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Thông báo đẩy (Push Notifications)</h3>
              <p className="text-sm text-muted-foreground">
                Nhận nhắc nhở luyện tập hàng ngày, duy trì streak, báo cáo tuần
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${currentConfig.color} bg-transparent`}>
              <Icon className="size-4" />
              <span>{currentConfig.label}</span>
            </div>
            {status === "unsubscribed" && (
              <Button onClick={handleSubscribe} disabled={isLoading} className="size-10">
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
              </Button>
            )}
            {status === "subscribed" && (
              <Button variant="outline" onClick={handleUnsubscribe} disabled={isLoading} className="size-10">
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <BellOff className="size-4" />}
              </Button>
            )}
            {status === "blocked" && (
              <Button variant="outline" onClick={() => window.open("https://support.google.com/chrome/answer/3220216?hl=vi", "_blank")} className="size-10">
                <AlertCircle className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm flex items-center gap-2">
            <AlertCircle className="size-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Preferences - only show if subscribed */}
      {status === "subscribed" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="font-semibold mb-4">Tùy chọn nhắc nhở</h3>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-2">
                  <Bell className="size-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Nhắc nhở hàng ngày</p>
                  <p className="text-sm text-muted-foreground">
                    Gửi lúc 20:00 nếu chưa hoàn thành bài học hôm nay
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={dailyReminder}
                onChange={(e) => {
                  setDailyReminder(e.target.checked);
                  savePreference("daily_reminder", e.target.checked);
                }}
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-50 p-2">
                  <span className="text-2xl">🔥</span>
                </div>
                <div>
                  <p className="font-medium">Cảnh báo streak</p>
                  <p className="text-sm text-muted-foreground">
                    Nhắc khi sắp mất chuỗi ngày liên tiếp
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={streakReminder}
                onChange={(e) => {
                  setStreakReminder(e.target.checked);
                  savePreference("streak_reminder", e.target.checked);
                }}
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-green-50 p-2">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <p className="font-medium">Báo cáo tuần</p>
                  <p className="text-sm text-muted-foreground">
                    Tóm tắt tiến độ mỗi chủ nhật tối
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={weeklyReport}
                onChange={(e) => {
                  setWeeklyReport(e.target.checked);
                  savePreference("weekly_report", e.target.checked);
                }}
                className="h-5 w-5 rounded border-border text-primary focus:ring-primary"
              />
            </label>
          </div>
        </div>
      )}

      {/* Browser Support Notice */}
      {status === "unsupported" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-amber-600 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Trình duyệt không hỗ trợ Push Notifications</p>
              <p className="mt-1">Tính năng này yêu cầu Service Worker và Push API. Hãy thử với Chrome, Edge, Firefox hoặc Safari mới nhất.</p>
            </div>
          </div>
        </div>
      )}

      {status === "blocked" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-red-600 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Thông báo bị chặn</p>
              <p className="mt-1">Bạn đã từ chối quyền thông báo. Hãy vào cài đặt trình duyệt để bật lại cho EnVi.</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => window.open("https://support.google.com/chrome/answer/3220216?hl=vi", "_blank")}>
                Hướng dẫn bật thông báo Chrome
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
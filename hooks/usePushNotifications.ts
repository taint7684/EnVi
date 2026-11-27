// Push Notification Hook - Client-side push subscription management
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PushSubscriptionStatus = "unsupported" | "unsubscribed" | "subscribed" | "blocked" | "pending";

interface UsePushNotificationsReturn {
  status: PushSubscriptionStatus;
  subscription: PushSubscription | null;
  error: string | null;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  requestPermission: () => Promise<NotificationPermission>;
}

async function checkSupportAndStatusInternal(
  setStatus: React.Dispatch<React.SetStateAction<PushSubscriptionStatus>>,
  setSubscription: React.Dispatch<React.SetStateAction<PushSubscription | null>>,
  setError: React.Dispatch<React.SetStateAction<string | null>>
) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    setStatus("unsupported");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const existingSubscription = await registration.pushManager.getSubscription();

    if (existingSubscription) {
      setSubscription(existingSubscription);
      setStatus("subscribed");
    } else {
      setStatus("unsubscribed");
    }

    // Check permission
    const permission = Notification.permission;
    if (permission === "denied") {
      setStatus("blocked");
    }
  } catch (err) {
    console.error("Push check error:", err);
    setError("Không thể kiểm tra trạng thái thông báo");
  }
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const [status, setStatus] = useState<PushSubscriptionStatus>("unsupported");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    checkSupportAndStatusInternal(setStatus, setSubscription, setError);
  }, []);

  async function requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      throw new Error("Thông báo không được hỗ trợ");
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      setStatus("unsubscribed");
    } else if (permission === "denied") {
      setStatus("blocked");
    }

    return permission;
  }

  async function subscribe() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      throw new Error("Push notifications không được hỗ trợ trên trình duyệt này");
    }

    setStatus("pending");
    setError(null);

    try {
      // Get VAPID public key
      const { data: keyData, error: keyError } = await supabase.functions.invoke("get-vapid-key");
      if (keyError) throw keyError;

      const vapidPublicKey = keyData?.publicKey || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) throw new Error("VAPID key not configured");

      const registration = await navigator.serviceWorker.ready;

      // Convert VAPID key
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey).buffer as ArrayBuffer;

      // Subscribe
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Save to server
      const { data: { user } } = await supabase.auth.getUser();
      const { error: saveError } = await supabase
        .from("push_subscriptions")
        .upsert({
          user_id: user?.id,
          endpoint: newSubscription.endpoint,
          p256dh: arrayBufferToBase64(newSubscription.getKey("p256dh")!),
          auth: arrayBufferToBase64(newSubscription.getKey("auth")!),
        }, {
          onConflict: "user_id",
        });

      if (saveError) throw saveError;

      setSubscription(newSubscription);
      setStatus("subscribed");
    } catch (err) {
      console.error("Subscribe error:", err);
      const message = err instanceof Error ? err.message : "Không thể đăng ký thông báo";
      setError(message);
      setStatus("unsubscribed");
      throw err;
    }
  }

  async function unsubscribe() {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();

      const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("endpoint", subscription.endpoint);

      if (error) throw error;

      setSubscription(null);
      setStatus("unsubscribed");
    } catch (err) {
      console.error("Unsubscribe error:", err);
      const message = err instanceof Error ? err.message : "Không thể hủy đăng ký";
      setError(message);
      throw err;
    }
  }

  return {
    status,
    subscription,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return window.btoa(binary);
}
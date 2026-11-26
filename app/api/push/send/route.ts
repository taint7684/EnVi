// Push Send API - Send push notifications to users

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import * as webpush from "web-push";

// Configure web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:admin@envi.app",
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Admin only or system trigger
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!user && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const body = await req.json();
  const { userId, title, body: notificationBody, url, tag, data } = body;
  
  // Get subscriptions to send to
  let query = supabase.from("push_subscriptions").select("*");
  
  if (userId) {
    query = query.eq("user_id", userId);
  } else {
    // Send to all active users who haven't completed today
    // This would need more complex logic in production
    query = query.limit(100);
  }
  
  const { data: subscriptions, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  if (!subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ sent: 0, message: "No subscriptions found" });
  }
  
  const payload = JSON.stringify({
    title: title || "EnVi - Luyện nói tiếng Anh",
    body: notificationBody || "Đã đến giờ luyện tập hôm nay!",
    url: url || "/today",
    tag: tag || "envi-daily-reminder",
    data: data || {},
  });
  
  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload
        );
        return { success: true, endpoint: sub.endpoint };
      } catch (err: any) {
        // If subscription expired (410), delete it
        if (err.statusCode === 410) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq("endpoint", sub.endpoint);
        }
        return { success: false, endpoint: sub.endpoint, error: err.message };
      }
    })
  );
  
  const sent = results.filter(r => r.status === "fulfilled" && r.value.success).length;
  const failed = results.length - sent;
  
  return NextResponse.json({ sent, failed, total: results.length });
}
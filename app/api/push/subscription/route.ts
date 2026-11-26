// Push Subscription API - Subscribe/Unsubscribe to push notifications

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import * as webpush from "web-push";

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    "mailto:admin@envi.app",
    vapidPublicKey,
    vapidPrivateKey
  );
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Get user's push subscription
  const { data: subscription } = await supabase
    .from("push_subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();
  
  return NextResponse.json({
    subscription: subscription || null,
    vapidPublicKey,
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const body = await req.json();
  const { action, subscription } = body;
  
  if (action === "subscribe") {
    if (!subscription) {
      return NextResponse.json({ error: "Subscription required" }, { status: 400 });
    }
    
    // Save subscription
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh,
        auth: subscription.keys?.auth,
        user_agent: req.headers.get("user-agent"),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      });
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  }
  
  if (action === "unsubscribe") {
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  }
  
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's curriculum progress
    const { data: progress, error } = await supabase
      .from("curriculum_progress")
      .select("day_index, current_phase")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 = no rows returned
      throw error;
    }

    // Default to week 1 if no progress found
    const dayIndex = progress?.day_index ?? 1;
    const weekNum = Math.max(1, Math.ceil(dayIndex / 7));

    return NextResponse.json({ 
      weekNum: Math.min(weekNum, 26),
      dayIndex,
      currentPhase: progress?.current_phase ?? "G1"
    }, {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600", // 5 min cache, 10 min stale
      }
    });
  } catch (e) {
    console.error("Current week error:", e);
    return NextResponse.json({ 
      weekNum: 1, 
      dayIndex: 1, 
      currentPhase: "G1" 
    }, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      }
    });
  }
}
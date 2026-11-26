import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all questions ordered by section and order_index
  const { data: questions, error } = await supabase
    .from("assessment_questions")
    .select("*")
    .order("section")
    .order("order_index");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get user's last completed assessment to determine starting level
  const { data: lastSession } = await supabase
    .from("assessment_sessions")
    .select("final_level, completed_at")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .single();

  return NextResponse.json({
    questions: questions?.map(q => ({
      id: q.id,
      section: q.section,
      skill: q.skill,
      difficulty: q.difficulty,
      question_type: q.question_type,
      prompt_text: q.prompt_text,
      prompt_audio_url: q.prompt_audio_url,
      options: q.options,
      cefr_level: q.cefr_level,
      weight: q.weight,
      order_index: q.order_index,
    })) || [],
    lastLevel: lastSession?.final_level || null,
  });
}
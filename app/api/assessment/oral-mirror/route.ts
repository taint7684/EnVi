import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { 
    week_num, 
    prompt_key, 
    prompt_text_en, 
    storage_path, 
    audio_duration_sec,
    transcript,
    wpm,
    word_count,
    pauses_over_3s,
    filler_count,
    vi_segments,
    onset_latency_ms,
    detected_language,
  } = body;

  if (!week_num || !prompt_key || !storage_path) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Calculate CEFR scores from metrics
  const fluencyScore = Math.max(0, Math.min(1, (wpm || 0) / 150)); // Normalize to ~150 wpm
  const accuracyScore = Math.max(0, Math.min(1, 1 - (vi_segments || 0) * 0.15));
  const prosodyScore = Math.max(0, Math.min(1, 1 - (pauses_over_3s || 0) * 0.1));
  const vocabRangeScore = Math.max(0, Math.min(1, (word_count || 0) / 200)); // Normalize

  const cefrScores = {
    fluency: Math.round(fluencyScore * 100) / 100,
    accuracy: Math.round(accuracyScore * 100) / 100,
    prosody: Math.round(prosodyScore * 100) / 100,
    vocab_range: Math.round(vocabRangeScore * 100) / 100,
  };

  // Estimate CEFR level
  const avgScore = (fluencyScore + accuracyScore + prosodyScore + vocabRangeScore) / 4;
  let estimatedLevel: "A1" | "A2" | "B1" | "B2" = "A1";
  if (avgScore >= 0.8) estimatedLevel = "B2";
  else if (avgScore >= 0.65) estimatedLevel = "B1";
  else if (avgScore >= 0.45) estimatedLevel = "A2";

  const { data: recording, error } = await supabase
    .from("oral_mirror_recordings")
    .insert({
      user_id: user.id,
      week_num,
      prompt_key,
      prompt_text_en,
      storage_path,
      audio_duration_sec,
      transcript,
      wpm,
      word_count,
      pauses_over_3s,
      filler_count,
      vi_segments: vi_segments || 0,
      onset_latency_ms,
      detected_language,
      cefr_scores: cefrScores,
      estimated_level: estimatedLevel,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ recording, cefrScores, estimatedLevel });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const weekNum = searchParams.get("week_num");

  let query = supabase
    .from("oral_mirror_recordings")
    .select("*")
    .eq("user_id", user.id)
    .order("week_num", { ascending: true });

  if (weekNum) {
    query = query.eq("week_num", parseInt(weekNum));
  }

  const { data: recordings, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ recordings: recordings || [] });
}
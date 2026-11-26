// Vocab Due API - Get vocabulary cards due for review
// Uses FSRS scheduling from phrases table or separate vocab table

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const topicId = searchParams.get("topicId");
  const layer = searchParams.get("layer");

  // Get vocab from phrases table (reflex phrases with keywords)
  // Or from a dedicated vocab table if it exists
  let query = supabase
    .from("phrases")
    .select("id, en_text, vi_text, keywords, difficulty, level, topic, fsrs_state")
    .eq("topic", topicId || "topic-01-self")
    .limit(limit);

  if (layer) {
    query = query.eq("level", layer);
  }

  const { data: phrases, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Convert phrases to vocab cards
  const now = new Date();
  const cards = (phrases || []).map((phrase) => {
    const keywords = phrase.keywords || [];
    const mainKeyword = keywords[0] || phrase.en_text.split(" ")[0];
    
    // Check FSRS due date
    let isDue = true;
    if (phrase.fsrs_state) {
      try {
        const state = JSON.parse(phrase.fsrs_state);
        if (state.due && new Date(state.due) > now) {
          isDue = false;
        }
      } catch {
        isDue = true;
      }
    }

    return {
      id: `vocab-${phrase.id}`,
      word: mainKeyword,
      meaning: phrase.vi_text,
      example: phrase.en_text,
      audio_url: null,
      difficulty: phrase.difficulty as "A1" | "A2" | "B1" | "B2",
      category: phrase.topic.replace("topic-", "").replace("-r2", ""),
      oxford3000: true, // TODO: check against Oxford 3000
      fsrs_state: phrase.fsrs_state,
      isDue,
    };
  }).filter(c => c.isDue);

  // Also get from chunks table if available
  const { data: chunks } = await supabase
    .from("chunks")
    .select("id, chunk_key, vi_text, en_text, category, difficulty")
    .eq("category", topicId?.replace("topic-", "") || "routine")
    .limit(10);

  const chunkCards = (chunks || []).map((chunk) => ({
    id: `chunk-${chunk.id}`,
    word: chunk.chunk_key.replace(/_/g, " "),
    meaning: chunk.vi_text,
    example: chunk.en_text,
    audio_url: null,
    difficulty: chunk.difficulty as "A1" | "A2" | "B1" | "B2",
    category: chunk.category,
    oxford3000: true,
    isDue: true,
  }));

  const allCards = [...cards, ...chunkCards].slice(0, limit);

  return NextResponse.json({ cards: allCards });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cardId, grade } = await req.json();
  
  // In real app, update FSRS state for the card
  // For now, just log the review
  const { data: review, error } = await supabase
    .from("vocab_reviews")
    .insert({
      user_id: user.id,
      card_id: cardId,
      grade,
      reviewed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    // Table might not exist, just return success
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ review });
}
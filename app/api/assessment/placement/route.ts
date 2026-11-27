// Placement Test API - Adaptive CEFR assessment
// Uses Oxford 3000 vocabulary filter + adaptive question selection

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getVocabularyLevel, calculateOxford3000Coverage } from "@/lib/oxford3000";

type Question = {
  id: string;
  section: string;
  skill: string;
  difficulty: string;
  question_type: "mcq" | "fill_blank" | "reorder" | "speaking_prompt";
  prompt_text: string;
  prompt_audio_url: string | null;
  options: { text: string; correct: boolean }[] | null;
  correct_answer: string | null;
  expected_keywords: string[] | null;
  cefr_level: string;
  weight: number;
  order_index: number;
};

type PlacementState = {
  currentLevel: "A1" | "A2" | "B1" | "B2";
  section: "vocab" | "grammar" | "listening" | "speaking";
  questionIndex: number;
  correctCount: number;
  totalCount: number;
  sectionScores: Record<string, number>;
  answers: Record<string, any>;
};

const SECTION_ORDER = ["vocab", "grammar", "listening", "speaking"] as const;
const LEVELS = ["A1", "A2", "B1", "B2"] as const;

function getNextLevel(current: "A1" | "A2" | "B1" | "B2", correct: boolean): "A1" | "A2" | "B1" | "B2" {
  const idx = LEVELS.indexOf(current);
  if (correct && idx < LEVELS.length - 1) return LEVELS[idx + 1]!;
  if (!correct && idx > 0) return LEVELS[idx - 1]!;
  return current;
}

function selectAdaptiveQuestions(
  allQuestions: Question[],
  state: PlacementState
): Question[] {
  const { currentLevel, section, questionIndex } = state;
  const sectionQuestions = allQuestions.filter(q => q.section === section);
  
  // Get questions for current level and adjacent levels
  const targetLevels = [currentLevel];
  const idx = LEVELS.indexOf(currentLevel);
  if (idx > 0) targetLevels.push(LEVELS[idx - 1]!);
  if (idx < LEVELS.length - 1) targetLevels.push(LEVELS[idx + 1]!);
  
  const available = sectionQuestions.filter(q => targetLevels.includes(q.cefr_level as any));
  available.sort((a, b) => a.order_index - b.order_index);
  
  return available.slice(questionIndex, questionIndex + 2); // Return next 2 questions
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Get all questions
  const { data: questions, error } = await supabase
    .from("assessment_questions")
    .select("*")
    .order("section")
    .order("order_index");
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
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
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const body = await req.json();
  const { action, sessionId, answers, userAnswer, transcript, latencyMs, viSegments, wpm } = body;
  
  if (action === "start") {
    // Create new placement session
    const { data: session, error } = await supabase
      .from("assessment_sessions")
      .insert({
        user_id: user.id,
        status: "in_progress",
        current_question_index: 0,
        estimated_level: "A2", // Start at A2
        section_scores: {},
      })
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ session });
  }
  
  if (action === "submit_answer" && sessionId) {
    // Get session state
    const { data: session } = await supabase
      .from("assessment_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();
    
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    
    // Get question details
    const { data: question } = await supabase
      .from("assessment_questions")
      .select("*")
      .eq("id", answers.question_id)
      .single();
    
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }
    
    // Evaluate answer
    let isCorrect = false;
    let score = 0;
    
    if (question.question_type === "mcq" && question.options) {
      const correctOption = question.options.find((o: any) => o.correct);
      isCorrect = userAnswer === correctOption?.text;
      score = isCorrect ? 1 : 0;
    } else if (question.question_type === "fill_blank") {
      // Simple text match for fill blank
      isCorrect = userAnswer?.toLowerCase().trim() === question.correct_answer?.toLowerCase().trim();
      score = isCorrect ? 1 : 0.5; // Partial credit
    } else if (question.question_type === "reorder") {
      // Check if words are in correct order
      isCorrect = userAnswer?.toLowerCase().trim() === question.correct_answer?.toLowerCase().trim();
      score = isCorrect ? 1 : 0.5;
    } else if (question.question_type === "speaking_prompt") {
      // Evaluate speaking: vocabulary coverage + keywords + fluency
      const vocabResult = calculateOxford3000Coverage(transcript || "");
      const keywordMatches = question.expected_keywords?.filter((kw: string) => 
        transcript?.toLowerCase().includes(kw.toLowerCase())
      ).length || 0;
      const keywordScore = question.expected_keywords ? keywordMatches / question.expected_keywords.length : 0.5;
      
      // Combined score: 40% vocab, 40% keywords, 20% fluency (wpm)
      const fluencyScore = Math.min(1, (wpm || 0) / 150); // Normalize to 150 wpm
      score = 0.4 * vocabResult.coverage + 0.4 * keywordScore + 0.2 * fluencyScore;
      isCorrect = score >= 0.6;
    }
    
    // Save answer
    await supabase.from("assessment_answers").insert({
      user_id: user.id,
      session_id: sessionId,
      question_id: question.id,
      user_answer: userAnswer,
      transcript: transcript,
      latency_ms: latencyMs,
      vi_segments: viSegments,
      wpm: wpm,
      is_correct: isCorrect,
      score: score,
    });
    
    // Update session state
    const newIndex = session.current_question_index + 1;
    const newEstimatedLevel = getNextLevel(session.estimated_level as any, isCorrect);
    
    const sectionScores = session.section_scores || {};
    if (!sectionScores[question.section]) sectionScores[question.section] = 0;
    sectionScores[question.section] = (sectionScores[question.section] * session.current_question_index + score) / (session.current_question_index + 1);
    
    await supabase
      .from("assessment_sessions")
      .update({
        current_question_index: newIndex,
        estimated_level: newEstimatedLevel,
        section_scores: sectionScores,
      })
      .eq("id", sessionId);
    
    return NextResponse.json({ 
      answer: { is_correct: isCorrect, score },
      nextLevel: newEstimatedLevel,
      sectionScores,
    });
  }
  
  if (action === "complete" && sessionId) {
    // Get all answers for this session
    const { data: answers } = await supabase
      .from("assessment_answers")
      .select("*")
      .eq("session_id", sessionId);
    
    const { data: session } = await supabase
      .from("assessment_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();
    
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    
    // Calculate final scores
    const sectionScores = (session.section_scores || {}) as Record<string, number>;
    const totalScore = Object.values(sectionScores).reduce((a, b) => a + b, 0) / Object.keys(sectionScores).length;
    
    // Determine final CEFR level based on weighted average
    let finalLevel: "A1" | "A2" | "B1" | "B2" = "A1";
    if (totalScore >= 0.75) finalLevel = "B2";
    else if (totalScore >= 0.55) finalLevel = "B1";
    else if (totalScore >= 0.35) finalLevel = "A2";
    
    // Update session
    await supabase
      .from("assessment_sessions")
      .update({
        status: "completed",
        final_level: finalLevel,
        total_score: totalScore,
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);
    
    return NextResponse.json({
      final_level: finalLevel,
      overall_score: totalScore,
      section_scores: sectionScores,
    });
  }
  
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
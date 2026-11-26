import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { action, session_id, answers } = body;

  if (action === "start") {
    // Create new assessment session
    const { data: session, error } = await supabase
      .from("assessment_sessions")
      .insert({
        user_id: user.id,
        status: "in_progress",
        current_question_index: 0,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ session });
  }

  if (action === "submit_answer" && session_id) {
    const { question_id, user_answer, user_audio_path, latency_ms, vi_segments, wpm, transcript } = answers || {};
    
    if (!question_id) {
      return NextResponse.json({ error: "question_id required" }, { status: 400 });
    }

    // Get question details for scoring
    const { data: question } = await supabase
      .from("assessment_questions")
      .select("*")
      .eq("id", question_id)
      .single();

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    // Score the answer
    let is_correct = false;
    let score = 0;

    if (question.question_type === "mcq" && question.options) {
      const correctOption = question.options.find((o: any) => o.correct);
      is_correct = user_answer === correctOption?.text;
      score = is_correct ? 1 : 0;
    } else if (question.question_type === "fill_blank") {
      is_correct = user_answer?.toLowerCase().trim() === question.correct_answer?.toLowerCase().trim();
      score = is_correct ? 1 : 0;
    } else if (question.question_type === "reorder") {
      is_correct = user_answer?.toLowerCase().trim() === question.correct_answer?.toLowerCase().trim();
      score = is_correct ? 1 : 0;
    } else if (question.question_type === "speaking_prompt") {
      // Speaking evaluation - basic keyword matching + metrics
      const keywords = question.expected_keywords || [];
      const transcriptLower = transcript?.toLowerCase() || "";
      const matchedKeywords = keywords.filter((k: string) => transcriptLower.includes(k.toLowerCase()));
      const keywordScore = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;
      
      // Factor in fluency metrics
      const viPenalty = Math.min(vi_segments * 0.1, 0.5);
      const latencyBonus = latency_ms && latency_ms < 3000 ? 0.1 : 0;
      
      score = Math.max(0, Math.min(1, keywordScore * 0.7 + (1 - viPenalty) * 0.2 + latencyBonus));
      is_correct = score >= 0.6;
    }

    // Save answer
    const { data: answer, error: answerError } = await supabase
      .from("assessment_answers")
      .insert({
        session_id,
        question_id,
        user_answer,
        user_audio_path,
        is_correct,
        score,
        latency_ms,
        vi_segments: vi_segments || 0,
        wpm: wpm || 0,
        transcript,
      })
      .select()
      .single();

    if (answerError) {
      return NextResponse.json({ error: answerError.message }, { status: 500 });
    }

    // Update session progress
    const { data: session } = await supabase
      .from("assessment_sessions")
      .select("current_question_index")
      .eq("id", session_id)
      .single();

    const nextIndex = (session?.current_question_index || 0) + 1;
    await supabase
      .from("assessment_sessions")
      .update({ current_question_index: nextIndex })
      .eq("id", session_id);

    return NextResponse.json({ 
      answer,
      next_question_index: nextIndex,
      is_correct,
      score,
    });
  }

  if (action === "complete" && session_id) {
    // Calculate final scores
    const { data: answers } = await supabase
      .from("assessment_answers")
      .select("*, assessment_questions(section, weight, cefr_level)")
      .eq("session_id", session_id);

    if (!answers || answers.length === 0) {
      return NextResponse.json({ error: "No answers found" }, { status: 400 });
    }

    // Calculate section scores
    const sectionScores: Record<string, { total: number; earned: number }> = {};
    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const ans of answers) {
      const q = ans.assessment_questions as any;
      const section = q.section;
      const weight = q.weight || 1;
      
      if (!sectionScores[section]) {
        sectionScores[section] = { total: 0, earned: 0 };
      }
      sectionScores[section].total += weight;
      sectionScores[section].earned += ans.score * weight;
      
      totalWeightedScore += ans.score * weight;
      totalWeight += weight;
    }

    const sectionPercentages: Record<string, number> = {};
    for (const [section, scores] of Object.entries(sectionScores)) {
      sectionPercentages[section] = scores.total > 0 ? scores.earned / scores.total : 0;
    }

    const overallScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;

    // Determine CEFR level based on overall score and section performance
    let finalLevel: "A1" | "A2" | "B1" | "B2" = "A1";
    if (overallScore >= 0.85 && sectionPercentages.grammar >= 0.7 && sectionPercentages.vocab >= 0.7) {
      finalLevel = "B2";
    } else if (overallScore >= 0.7 && sectionPercentages.grammar >= 0.6 && sectionPercentages.vocab >= 0.6) {
      finalLevel = "B1";
    } else if (overallScore >= 0.55) {
      finalLevel = "A2";
    }

    const { error: updateError } = await supabase
      .from("assessment_sessions")
      .update({
        status: "completed",
        estimated_level: finalLevel,
        final_level: finalLevel,
        total_score: overallScore,
        section_scores: sectionPercentages,
        completed_at: new Date().toISOString(),
      })
      .eq("id", session_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Update user's curriculum progress with placement
    await supabase
      .from("curriculum_progress")
      .upsert({
        user_id: user.id,
        current_day: finalLevel === "A1" ? 1 : finalLevel === "A2" ? 31 : finalLevel === "B1" ? 61 : 91,
        baseline_latency_ms: null,
        baseline_wpm: null,
      });

    return NextResponse.json({
      final_level: finalLevel,
      overall_score: overallScore,
      section_scores: sectionPercentages,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
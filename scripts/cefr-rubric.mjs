#!/usr/bin/env node
// CEFR Rubric AI Grading for Assessment
// Run with: node scripts/cefr-rubric.mjs

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const CEFR_RUBRIC_PROMPT = `You are an expert CEFR assessor. Evaluate the learner's spoken English across 5 criteria.

Return JSON ONLY with this exact schema:
{
  "range": { "score": 1-5, "evidence": "specific examples from transcript" },
  "accuracy": { "score": 1-5, "evidence": "specific examples from transcript" },
  "fluency": { "score": 1-5, "evidence": "specific examples from transcript" },
  "interaction": { "score": 1-5, "evidence": "specific examples from transcript" },
  "coherence": { "score": 1-5, "evidence": "specific examples from transcript" },
  "overall_cefr": "A1|A2|B1|B2|C1",
  "summary": "2-3 sentence encouraging summary",
  "strongest_skill": "range|accuracy|fluency|interaction|coherence",
  "priority_area": "range|accuracy|fluency|interaction|coherence"
}

CEFR LEVEL DESCRIPTORS:
- A1 (score 1-2): Basic phrases, simple sentences, frequent pauses, limited vocabulary
- A2 (score 2-3): Simple exchanges, routine tasks, some errors but communicative
- B1 (score 3-4): Connected speech, main points clear, handles familiar topics
- B2 (score 4-5): Complex arguments, natural flow, good control, spontaneous
- C1 (score 5): Fluent, flexible, precise, idiomatic

CRITERIA DEFINITIONS:
1. RANGE: Vocabulary breadth, grammatical complexity, variety of structures
2. ACCURACY: Grammar, pronunciation, word choice correctness
3. FLUENCY: Speed, pausing, hesitation, flow, self-correction
4. INTERACTION: Responsiveness, turn-taking, clarification, engagement
5. COHERENCE: Logical flow, connectors, topic development, organization`;

async function gradeWithCEFR(transcript, layer, userId) {
  const { aiRouter } = await import('../lib/ai/router.ts');
  
  const result = await aiRouter.generate({
    task: 'cefr_assessment',
    schema: z.object({
      range: z.object({ score: z.number().min(1).max(5), evidence: z.string() }),
      accuracy: z.object({ score: z.number().min(1).max(5), evidence: z.string() }),
      fluency: z.object({ score: z.number().min(1).max(5), evidence: z.string() }),
      interaction: z.object({ score: z.number().min(1).max(5), evidence: z.string() }),
      coherence: z.object({ score: z.number().min(1).max(5), evidence: z.string() }),
      overall_cefr: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
      summary: z.string(),
      strongest_skill: z.enum(['range', 'accuracy', 'fluency', 'interaction', 'coherence']),
      priority_area: z.enum(['range', 'accuracy', 'fluency', 'interaction', 'coherence']),
    }),
    messages: [
      { role: 'system', content: CEFR_RUBRIC_PROMPT },
      { role: 'user', content: `Layer: ${layer}\nTranscript: "${transcript}"` },
    ],
    userId,
    timeoutMs: 15000,
  });
  
  return result.data;
}

// Milestone auto-adjust logic
function adjustTargets(baseline, current, day) {
  const baselineCefr = baseline.overall_cefr;
  const currentCefr = current.overall_cefr;
  
  const cefrOrder = ['A1', 'A2', 'B1', 'B2', 'C1'];
  const baselineIdx = cefrOrder.indexOf(baselineCefr);
  const currentIdx = cefrOrder.indexOf(currentCefr);
  
  // If improved by 1+ level, raise targets
  if (currentIdx > baselineIdx) {
    return {
      raised: true,
      new_target: cefrOrder[Math.min(currentIdx + 1, 4)],
      reason: `Improved from ${baselineCefr} to ${currentCefr}`,
    };
  }
  
  return { raised: false, new_target: null, reason: 'Maintaining trajectory' };
}

// Encouraging output generator
function generateEncouragingOutput(previous, current, strongest, priority) {
  const improvements = [];
  
  const criteria = ['range', 'accuracy', 'fluency', 'interaction', 'coherence'];
  for (const c of criteria) {
    if (current[c].score > previous[c].score) {
      improvements.push(`${c} (+${current[c].score - previous[c].score})`);
    }
  }
  
  let output = `🎉 **Progress since last assessment!**\n\n`;
  
  if (improvements.length > 0) {
    output += `**Improved:** ${improvements.join(', ')}\n`;
  }
  
  output += `**Strongest skill:** ${strongest} — ${getSkillDescription(strongest)}\n`;
  output += `**Focus area:** ${priority} — ${getPriorityTip(priority)}\n\n`;
  output += `Keep going! Consistent speaking practice is the key.`;
  
  return output;
}

function getSkillDescription(skill) {
  const desc = {
    range: 'You use varied vocabulary and structures',
    accuracy: 'Your grammar and pronunciation are solid',
    fluency: 'You speak smoothly with natural flow',
    interaction: 'You engage well and respond naturally',
    coherence: 'Your ideas connect logically',
  };
  return desc[skill];
}

function getPriorityTip(priority) {
  const tips = {
    range: 'Learn 3 new chunks/week and use them in speaking',
    accuracy: 'Record yourself, compare with model, repeat',
    fluency: 'Do 4/3/2 drills daily — speed up without losing clarity',
    interaction: 'Practice asking follow-up questions in Free Talk',
    coherence: 'Use connectors: "First, ... Then, ... Finally, ..."',
  };
  return tips[priority];
}

export { gradeWithCEFR, adjustTargets, generateEncouragingOutput };
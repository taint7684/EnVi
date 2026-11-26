// VI→EN Translation API for Speaking Lifeline
// Translates Vietnamese to natural spoken English with context awareness

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-20b";

const LAYER_GUIDANCE = {
  L1: "Present simple, habits, likes/dislikes, basic descriptions. Use contractions (I'm, I've). Keep it simple and conversational.",
  L2: "Past simple, past continuous, present perfect. Sequencing (First, Then, After, Finally). Narrative tenses, storytelling. Express feelings.",
  L3: "Opinion, argument, hypothesis. Complex structures (conditionals, passive). Discourse markers (however, therefore, furthermore). Academic/formal register when appropriate.",
};

const TOPIC_CONTEXTS: Record<string, string> = {
  "topic-01-self": "daily routine, personal habits, self-introduction",
  "topic-02-family": "family members, relationships, family activities",
  "topic-03-friends": "friendship, socializing, communication",
  "topic-04-work-daily": "work routine, job description, workplace",
  "topic-05-hobbies": "hobbies, free time activities, interests",
  "topic-06-food": "food, cooking, eating out, recipes",
  "topic-07-home": "home, living space, neighborhood",
  "topic-08-love": "relationships, dating, marriage, love",
  "topic-09-health": "health, exercise, mental health, emotions",
  "topic-10-travel": "travel, trips, planning, experiences",
  "topic-11-money": "money, budgeting, shopping, finance",
  "topic-12-tech": "technology, phone, apps, social media",
  "topic-13-dreams": "goals, plans, dreams, future aspirations",
};

export async function POST(req: NextRequest) {
  try {
    const { vietnamese, topicContext, layer } = await req.json();
    
    if (!vietnamese || !vietnamese.trim()) {
      return NextResponse.json({ error: "Vietnamese text required" }, { status: 400 });
    }

    if (!GROQ_API_KEY) {
      // Fallback without AI
      return NextResponse.json({
        english: getFallbackTranslation(vietnamese, layer as "L1" | "L2" | "L3"),
        suggestions: [],
      });
    }

    const currentLayer = (layer as "L1" | "L2" | "L3") || "L1";
    const topicInfo = TOPIC_CONTEXTS[topicContext] || "general conversation";
    const guidance = LAYER_GUIDANCE[currentLayer];

    const systemPrompt = `You are an expert English teacher helping Vietnamese learners speak naturally.
Translate the Vietnamese input to NATURAL SPOKEN ENGLISH appropriate for CEFR level ${currentLayer === "L1" ? "A1/A2" : currentLayer === "L2" ? "A2/B1" : "B1/B2"}.

CONTEXT:
- Topic: ${topicInfo}
- Layer: ${currentLayer} (${guidance})
- Target: Natural spoken English for conversation practice

RULES:
1. Use contractions (I'm, I've, don't, can't, etc.)
2. Use spoken fillers naturally (well, you know, actually, I mean)
3. Match the grammar complexity to the layer
4. Return 1 main translation + 2-3 paraphrase alternatives
5. Keep it conversational, NOT textbook formal

Return JSON: { "english": "main translation", "suggestions": ["alt1", "alt2", "alt3"] }`;

    const userPrompt = `Vietnamese: "${vietnamese}"
Context: ${topicInfo} (Layer ${currentLayer})

Translate to natural spoken English for a ${currentLayer} learner.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      
      // Return fallback on API error
      return NextResponse.json({
        english: getFallbackTranslation(vietnamese, currentLayer),
        suggestions: [],
        fallback: true,
      });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json({
        english: getFallbackTranslation(vietnamese, currentLayer),
        suggestions: [],
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      // If JSON parsing fails, extract from text
      return NextResponse.json({
        english: content.replace(/[{}"]/g, "").trim(),
        suggestions: [],
      });
    }

    return NextResponse.json({
      english: parsed.english || getFallbackTranslation(vietnamese, currentLayer),
      suggestions: parsed.suggestions || [],
    });

  } catch (err) {
    console.error("VI→EN translation error:", err);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}

function getFallbackTranslation(vietnamese: string, layer: "L1" | "L2" | "L3"): string {
  // Simple keyword-based fallback
  const lower = vietnamese.toLowerCase();
  
  const patterns: Record<string, Record<"L1" | "L2" | "L3", string>> = {
    "thích": { L1: "I like", L2: "I enjoyed", L3: "I'm fond of" },
    "yêu thích": { L1: "My favorite is", L2: "I used to love", L3: "I have a preference for" },
    "thường": { L1: "I usually", L2: "I used to", L3: "I tend to" },
    "hôm qua": { L1: "Yesterday", L2: "Yesterday, I", L3: "Looking back to yesterday," },
    "nghĩ": { L1: "I think", L2: "I thought", L3: "In my opinion" },
    "cho rằng": { L1: "I think", L2: "I believed", L3: "I would argue that" },
    "vì": { L1: "Because", L2: "Since", L3: "Due to the fact that" },
    "tuy nhiên": { L1: "But", L2: "However", L3: "Nevertheless" },
    "nên": { L1: "Should", L2: "Should have", L3: "Ought to" },
    "có thể": { L1: "Can", L2: "Could", L3: "Might be able to" },
  };

  for (const [vn, translations] of Object.entries(patterns)) {
    if (lower.includes(vn)) {
      return translations[layer];
    }
  }

  // Default fallbacks by layer
  const defaults = {
    L1: "I want to say: " + vietnamese,
    L2: "Let me tell you: " + vietnamese,
    L3: "From my perspective: " + vietnamese,
  };

  return defaults[layer];
}
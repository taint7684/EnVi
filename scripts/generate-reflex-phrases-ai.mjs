#!/usr/bin/env node
// AI-powered batch generation of 1,456 reflex phrases (26 topics × 7 days × 8 phrases)
// Uses AI Router (Ollama → Groq → OpenRouter) with structured output
// Run with: node scripts/generate-reflex-phrases-ai.mjs

import "dotenv/config";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Ensure .env.local is loaded.");
  process.exit(1);
}

// Import aiRouter dynamically to avoid ESM issues
const { aiRouter } = await import("../lib/ai/router.js");

const supabase = createClient(supabaseUrl, supabaseKey);

// 26 topics (13 topics × 2 rounds)
const TOPICS = [
  // Round 1 - Basic
  { id: "topic-01-self", name: "Self & Routine", round: 1, level: "L1" },
  { id: "topic-02-family", name: "Family", round: 1, level: "L1" },
  { id: "topic-03-friends", name: "Friends & Communication", round: 1, level: "L1" },
  { id: "topic-04-work-daily", name: "Daily Work", round: 1, level: "L1" },
  { id: "topic-05-hobbies", name: "Hobbies & Free Time", round: 1, level: "L1" },
  { id: "topic-06-food", name: "Food & Cooking", round: 1, level: "L1" },
  { id: "topic-07-home", name: "Home & Living", round: 1, level: "L1" },
  { id: "topic-08-love", name: "Love & Relationships", round: 1, level: "L1" },
  { id: "topic-09-health", name: "Health & Emotions", round: 1, level: "L1" },
  { id: "topic-10-travel", name: "Travel", round: 1, level: "L1" },
  { id: "topic-11-money", name: "Money & Shopping", round: 1, level: "L1" },
  { id: "topic-12-tech", name: "Tech & Phone", round: 1, level: "L1" },
  { id: "topic-13-dreams", name: "Plans & Dreams", round: 1, level: "L1" },
  // Round 2 - Advanced
  { id: "topic-01-self-r2", name: "Self & Routine (Advanced)", round: 2, level: "L2" },
  { id: "topic-02-family-r2", name: "Family (Advanced)", round: 2, level: "L2" },
  { id: "topic-03-friends-r2", name: "Friends & Networking", round: 2, level: "L2" },
  { id: "topic-04-work-daily-r2", name: "Advanced Work", round: 2, level: "L2" },
  { id: "topic-05-hobbies-r2", name: "Professional Hobbies", round: 2, level: "L2" },
  { id: "topic-06-food-r2", name: "Food Culture", round: 2, level: "L2" },
  { id: "topic-07-home-r2", name: "Workspace", round: 2, level: "L2" },
  { id: "topic-08-love-r2", name: "Long-term Relationships", round: 2, level: "L2" },
  { id: "topic-09-health-r2", name: "Sustainable Health", round: 2, level: "L2" },
  { id: "topic-10-travel-r2", name: "Business Travel", round: 2, level: "L2" },
  { id: "topic-11-money-r2", name: "Personal Finance", round: 2, level: "L2" },
  { id: "topic-12-tech-r2", name: "Advanced Tech", round: 2, level: "L2" },
  { id: "topic-13-dreams-r2", name: "5-Year Plan", round: 2, level: "L2" },
];

const SENTENCE_TYPES = ["qa", "situation", "continue", "paraphrase", "circumlocution"];

const SENTENCE_TYPE_LABELS = {
  qa: "Question-Answer",
  situation: "Situation Response",
  continue: "Continue the Story",
  paraphrase: "Paraphrase/Rephrase",
  circumlocution: "Explain Without Key Word",
};

const SENTENCE_TYPE_DESCRIPTIONS = {
  qa: "Direct question requiring a natural spoken answer",
  situation: "Describe what you'd say in a specific context",
  continue: "Continue a narrative or sequence naturally",
  paraphrase: "Express the same meaning with different words",
  circumlocution: "Explain a concept without using the key word",
};

// Zod schema for a single reflex phrase
const ReflexPhraseSchema = z.object({
  vi_text: z.string().min(5).max(200).describe("Vietnamese prompt text"),
  en_text: z.string().min(5).max(200).describe("Natural spoken English target sentence"),
  audio_url: z.null().describe("Will be generated separately via TTS"),
  situation_en: z.string().min(10).max(300).describe("English situation/context for the learner"),
  en_alternatives: z.array(z.string()).min(1).max(5).describe("2-5 natural alternative English responses"),
  keywords: z.array(z.string()).min(2).max(6).describe("2-6 key vocabulary words from the phrase"),
  sentence_type: z.enum(SENTENCE_TYPES),
  difficulty: z.enum(["A1", "A2", "B1", "B2"]),
  level: z.enum(["L1", "L2", "L3"]),
  topic: z.string(),
  reflex_reviewed: z.boolean().default(false),
});

function jsArrayToPgArray(arr) {
  return "{" + arr.map(s => '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"').join(",") + "}";
}

function buildPrompt(topic, day, sentenceType) {
  const dayContexts = [
    "Morning routine & waking up",
    "Getting ready & personal care",
    "Commute & arriving at work",
    "Morning work & focus time",
    "Lunch & afternoon work",
    "Evening routine & wind down",
    "Weekend & reflection",
  ];
  
  const context = dayContexts[day] || "Daily life";
  const isAdvanced = topic.round === 2;
  
  return `Generate 1 reflex phrase for Vietnamese learners of English.

TOPIC: ${topic.name} (Round ${topic.round}, ${topic.level})
DAY CONTEXT: Day ${day + 1} - ${context}
SENTENCE TYPE: ${SENTENCE_TYPE_LABELS[sentenceType]} - ${SENTENCE_TYPE_DESCRIPTIONS[sentenceType]}
DIFFICULTY: ${isAdvanced ? "A2/B1" : "A1/A2"}
LEVEL: ${topic.level}

REQUIREMENTS:
- vi_text: Natural Vietnamese prompt (5-200 chars)
- en_text: Natural spoken English (5-200 chars) - contractions, fillers, spoken grammar OK
- situation_en: Clear English context for learner (10-300 chars)
- en_alternatives: 2-5 natural variations (contractions, synonyms, different structures)
- keywords: 2-6 key vocabulary words
- sentence_type: "${sentenceType}"
- difficulty: A1/A2/B1/B2 appropriate for ${topic.level}
- level: "${topic.level}"
- topic: "${topic.id}"

CONSTRAINTS:
- NO textbook/formal English - use natural spoken forms (I'm, I've, gonna, wanna, etc. where appropriate)
- Vietnamese text should be natural, not translated word-for-word
- situation_en should set a clear scene for the learner
- en_alternatives must be genuinely different ways to express the same meaning
- Keywords should be the most useful vocabulary from the phrase

Return JSON matching the schema exactly.`;
}

async function generatePhraseBatch(topic, day) {
  // Generate 8 phrases (one per sentence type, cycling through)
  const phrases = [];
  
  for (let i = 0; i < 8; i++) {
    const sentenceType = SENTENCE_TYPES[i % 5];
    
    try {
      const result = await aiRouter.generate({
        task: "reflex_phrase_gen",
        schema: ReflexPhraseSchema,
        messages: [
          { role: "system", content: "You are an expert English teacher creating natural spoken English phrases for Vietnamese learners. Generate authentic, conversational English that sounds native." },
          { role: "user", content: buildPrompt(topic, day, sentenceType) },
        ],
        timeoutMs: 15000,
      });
      
      phrases.push({
        ...result.data,
        topic: topic.id,
      });
      
      console.log(`  ✅ ${topic.id} Day ${day + 1} ${sentenceType}: "${result.data.en_text.substring(0, 50)}..."`);
      
      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    } catch (error) {
      console.error(`  ❌ ${topic.id} Day ${day + 1} ${sentenceType} failed:`, error);
      // Fallback to template
      phrases.push(generateFallbackPhrase(topic, day, i, sentenceType));
    }
  }
  
  return phrases;
}

function generateFallbackPhrase(topic, day, phraseNum, sentenceType) {
  const dayContexts = [
    "Morning routine",
    "Getting ready",
    "Commute",
    "Work focus",
    "Afternoon",
    "Evening",
    "Weekend",
  ];
  
  const templates = {
    "Self & Routine": {
      qa: { vi: "Tôi thường dậy sớm vào buổi sáng.", en: "I usually wake up early in the morning.", sit: "Your alarm goes off. What time do you wake up?", alt: ["I get up early.", "I'm an early riser."], kw: ["wake", "early", "morning"] },
      situation: { vi: "Tôi uống cà phê để tỉnh táo.", en: "I drink coffee to stay alert.", sit: "You're at the kitchen counter. What do you do first?", alt: ["I have coffee to wake up.", "Coffee helps me focus."], kw: ["drink", "coffee", "alert"] },
      continue: { vi: "Tôi tập thể dục mỗi ngày.", en: "I exercise every day.", sit: "Describe your morning routine. What comes after coffee?", alt: ["I work out daily.", "Daily exercise is my habit."], kw: ["exercise", "every", "day"] },
      paraphrase: { vi: "Tôi lên kế hoạch cho ngày mới.", en: "I plan my day.", sit: "How do you start your workday? Say it differently.", alt: ["I organize my schedule.", "I map out my tasks."], kw: ["plan", "day"] },
      circumlocution: { vi: "Tôi ăn trưa tại bàn làm việc.", en: "I eat lunch at my desk.", sit: "Where do you usually have lunch? Explain without saying 'at my desk'.", alt: ["I have lunch at my desk.", "Lunch is at my workstation."], kw: ["eat", "lunch", "desk"] },
    },
    "Family": {
      qa: { vi: "Gia đình tôi có bốn người.", en: "There are four people in my family.", sit: "Tell me about your family.", alt: ["My family has four members.", "We're a family of four."], kw: ["four", "people", "family"] },
      situation: { vi: "Cha tôi là kỹ sư.", en: "My father is an engineer.", sit: "What does your father do?", alt: ["Dad works as an engineer.", "My dad's an engineer."], kw: ["father", "engineer"] },
      continue: { vi: "Chúng tôi ăn tối cùng nhau.", en: "We have dinner together.", sit: "What's your family routine?", alt: ["We eat dinner as a family.", "Family dinner is our routine."], kw: ["dinner", "together"] },
      paraphrase: { vi: "Tết là dịp sum họp gia đình.", en: "Tet is for family reunion.", sit: "What's a special family occasion?", alt: ["We gather for Tet.", "Tet means family time."], kw: ["Tet", "reunion", "family"] },
      circumlocution: { vi: "Con cái lớn rồi tự lập.", en: "Kids grow up and become independent.", sit: "How do family dynamics change?", alt: ["Children eventually leave home.", "They become independent adults."], kw: ["kids", "grow", "independent"] },
    },
  };
  
  const topicTemplates = templates[topic.name] || templates["Self & Routine"];
  const template = topicTemplates[sentenceType] || topicTemplates.qa;
  
  const daySuffix = ` (ngày ${day + 1})`;
  const phraseSuffix = phraseNum > 4 ? ` - cách ${phraseNum - 3}` : "";
  
  return {
    vi_text: template.vi + daySuffix + phraseSuffix,
    en_text: template.en + daySuffix + phraseSuffix,
    audio_url: null,
    situation_en: template.sit,
    en_alternatives: template.alt,
    keywords: template.kw,
    sentence_type: sentenceType,
    difficulty: topic.level === "L1" ? "A2" : "B1",
    level: topic.level,
    topic: topic.id,
    reflex_reviewed: false,
  };
}

async function main() {
  console.log("🚀 AI-Powered Reflex Phrase Generation (1,456 phrases)\n");
  
  // Check existing phrases
  const { data: existing } = await supabase.from("phrases").select("id, topic");
  const existingIds = new Set(existing?.map(p => p.id) || []);
  console.log(`📊 Existing phrases in DB: ${existingIds.size}\n`);
  
  let allPhrases = [];
  let totalGenerated = 0;
  let totalSkipped = 0;
  
  for (let i = 0; i < TOPICS.length; i++) {
    const topic = TOPICS[i];
    console.log(`\n📝 Topic ${i + 1}/26: ${topic.name} (${topic.id})`);
    
    const topicPhrases = [];
    
    for (let day = 0; day < 7; day++) {
      console.log(`  🌅 Day ${day + 1}/7...`);
      const dayPhrases = await generatePhraseBatch(topic, day);
      
      // Add IDs and timestamps
      for (let phraseNum = 0; phraseNum < dayPhrases.length; phraseNum++) {
        const id = `${topic.id}-d${day + 1}-p${phraseNum + 1}`;
        if (existingIds.has(id)) {
          totalSkipped++;
          continue;
        }
        topicPhrases.push({
          ...dayPhrases[phraseNum],
          id,
          created_at: new Date().toISOString(),
        });
      }
    }
    
    console.log(`  📦 Topic ${topic.name}: ${topicPhrases.length} new phrases`);
    allPhrases.push(...topicPhrases);
    totalGenerated += topicPhrases.length;
  }
  
  console.log(`\n📊 Summary: ${totalGenerated} new phrases, ${totalSkipped} skipped (existing)`);
  
  if (allPhrases.length === 0) {
    console.log("✅ Nothing to insert. All phrases already exist.");
    return;
  }
  
  // Convert to DB format
  const dbPhrases = allPhrases.map(p => ({
    id: p.id,
    vi_text: p.vi_text,
    en_text: p.en_text,
    audio_url: p.audio_url,
    topic: p.topic,
    difficulty: p.difficulty,
    level: p.level,
    en_alternatives: jsArrayToPgArray(p.en_alternatives),
    situation_en: p.situation_en,
    keywords: jsArrayToPgArray(p.keywords),
    reflex_reviewed: p.reflex_reviewed,
    created_at: p.created_at,
    sentence_type: p.sentence_type,
  }));
  
  // Batch insert (50 at a time)
  const batchSize = 50;
  let inserted = 0;
  
  for (let i = 0; i < dbPhrases.length; i += batchSize) {
    const batch = dbPhrases.slice(i, i + batchSize);
    const { error } = await supabase.from("phrases").insert(batch);
    if (error) {
      console.error(`❌ Batch ${i / batchSize + 1} failed:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`✅ Batch ${i / batchSize + 1} inserted (${batch.length} phrases)`);
    }
  }
  
  console.log(`\n🎉 Complete! ${inserted} phrases inserted into database.`);
}

main().catch(console.error);
/**
 * Generate Reflex core data (en_alternatives, situation_en, keywords)
 * for ALL phrases using template-based rules. No AI needed.
 *
 * Generates reasonable alternatives, situations, and keywords instantly.
 * Marks reflex_reviewed = false (AI-generated, unreviewed).
 *
 * Usage: npx tsx scripts/generate-reflex-templates.ts
 */
import { makeAdminClient } from "./lib/supabase";
import { loadEnv } from "./lib/env";

type PhraseRow = {
  id: string;
  vi_text: string;
  en_text: string;
  difficulty: string;
  topic: string;
};

type ReflexData = {
  en_alternatives: string[];
  situation_en: string;
  keywords: string[];
};

const CONTRACTIONS: [RegExp, string][] = [
  [/\bI am\b/gi, "I'm"],
  [/\bI have\b/gi, "I've"],
  [/\bI will\b/gi, "I'll"],
  [/\bI would\b/gi, "I'd"],
  [/\byou are\b/gi, "you're"],
  [/\byou have\b/gi, "you've"],
  [/\byou will\b/gi, "you'll"],
  [/\byou would\b/gi, "you'd"],
  [/\bwe are\b/gi, "we're"],
  [/\bwe have\b/gi, "we've"],
  [/\bwe will\b/gi, "we'll"],
  [/\bthey are\b/gi, "they're"],
  [/\bthey have\b/gi, "they've"],
  [/\bhe is\b/gi, "he's"],
  [/\bshe is\b/gi, "she's"],
  [/\bit is\b/gi, "it's"],
  [/\bthat is\b/gi, "that's"],
  [/\bthere is\b/gi, "there's"],
  [/\bdo not\b/gi, "don't"],
  [/\bdoes not\b/gi, "doesn't"],
  [/\bdid not\b/gi, "didn't"],
  [/\bis not\b/gi, "isn't"],
  [/\bare not\b/gi, "aren't"],
  [/\bwas not\b/gi, "wasn't"],
  [/\bwere not\b/gi, "weren't"],
  [/\bcan not\b/gi, "can't"],
  [/\bcannot\b/gi, "can't"],
  [/\bcould not\b/gi, "couldn't"],
  [/\bwill not\b/gi, "won't"],
  [/\bwould not\b/gi, "wouldn't"],
  [/\bshould not\b/gi, "shouldn't"],
  [/\bhave not\b/gi, "haven't"],
  [/\bhas not\b/gi, "hasn't"],
  [/\bhad not\b/gi, "hadn't"],
];

const MODAL_ALTERNATIVES: [RegExp, string[]][] = [
  [/\bcan\b/gi, ["could", "will be able to"]],
  [/\bwill\b/gi, ["would", "can"]],
  [/\bshould\b/gi, ["ought to", "had better"]],
  [/\bmust\b/gi, ["have to", "need to"]],
  [/\bwould like to\b/gi, ["want to", "hope to"]],
  [/\bwant to\b/gi, ["would like to", "hope to"]],
  [/\bneed to\b/gi, ["have to", "must"]],
  [/\bhave to\b/gi, ["need to", "must"]],
];

const GREETING_MAP: [RegExp, string[]][] = [
  [/\bhello\b/gi, ["hi", "hey"]],
  [/\bhi\b/gi, ["hello", "hey"]],
  [/\bhey\b/gi, ["hi", "hello"]],
  [/\bgood morning\b/gi, ["morning"]],
  [/\bgood afternoon\b/gi, ["afternoon"]],
  [/\bgood evening\b/gi, ["evening"]],
  [/\bgoodbye\b/gi, ["bye", "see you"]],
  [/\bbye\b/gi, ["goodbye", "see you"]],
  [/\bthank you\b/gi, ["thanks", "thank you so much"]],
  [/\bthanks\b/gi, ["thank you", "thanks a lot"]],
];

const POLITENESS_MAP: [RegExp, string[]][] = [
  [/\bgive me\b/gi, ["can I have", "could I get"]],
  [/\bI want\b/gi, ["I'd like", "I would like"]],
  [/\bI need\b/gi, ["I could use", "I'm looking for"]],
  [/\btell me\b/gi, ["could you tell me", "would you tell me"]],
  [/\bhelp me\b/gi, ["could you help me", "can you help me"]],
];

const SITUATION_TEMPLATES: Record<string, string[]> = {
  A2: [
    "You are in a daily situation. Respond in English.",
    "Someone asks you a simple question. Answer in English.",
    "You need to communicate a basic need. Say it in English.",
  ],
  B1: [
    "You are at work or in a social situation. Respond naturally in English.",
    "Your colleague asks you something. Answer in English.",
    "You are discussing a topic with someone. Express your opinion in English.",
  ],
  B2: [
    "You are in a professional discussion. Express your view in English.",
    "Someone asks for your opinion on a complex topic. Respond in English.",
    "You are negotiating or problem-solving. Explain your position in English.",
  ],
};

const TOPIC_SITUATIONS: Record<string, string> = {
  greeting: "You meet someone for the first time. Greet them.",
  shopping: "You are at a store. Ask for what you need.",
  food: "You are at a restaurant or cafe. Order something.",
  travel: "You are traveling. Ask for directions or information.",
  work: "You are at work. Communicate with a colleague.",
  health: "You are at a doctor or pharmacy. Describe your needs.",
  weather: "You are making small talk about the weather.",
  family: "You are talking about your family.",
  hobby: "You are discussing your hobbies and interests.",
  general: "You are in a daily situation. Respond in English.",
};

function toContractions(text: string): string {
  let result = text;
  for (const [pattern, replacement] of CONTRACTIONS) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

function toModalAlternatives(text: string): string[] {
  const alternatives: string[] = [];
  for (const [pattern, mods] of MODAL_ALTERNATIVES) {
    if (pattern.test(text)) {
      for (const mod of mods) {
        const alt = text.replace(pattern, mod);
        if (alt.toLowerCase() !== text.toLowerCase()) {
          alternatives.push(alt);
        }
      }
    }
  }
  return alternatives;
}

function toGreetingAlternatives(text: string): string[] {
  const alternatives: string[] = [];
  for (const [pattern, greetings] of GREETING_MAP) {
    if (pattern.test(text)) {
      for (const g of greetings) {
        const alt = text.replace(pattern, g);
        if (alt.toLowerCase() !== text.toLowerCase()) {
          alternatives.push(alt);
        }
      }
    }
  }
  return alternatives;
}

function toPolitenessAlternatives(text: string): string[] {
  const alternatives: string[] = [];
  for (const [pattern, polite] of POLITENESS_MAP) {
    if (pattern.test(text)) {
      for (const p of polite) {
        const alt = text.replace(pattern, p);
        if (alt.toLowerCase() !== text.toLowerCase()) {
          alternatives.push(alt);
        }
      }
    }
  }
  return alternatives;
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "shall",
    "should", "can", "could", "may", "might", "must", "to", "of", "in",
    "for", "on", "with", "at", "by", "from", "up", "about", "into",
    "over", "after", "i", "you", "he", "she", "it", "we", "they",
    "me", "him", "her", "us", "them", "my", "your", "his", "its",
    "our", "their", "this", "that", "these", "those", "am", "not",
    "no", "yes", "so", "very", "just", "too", "also", "here", "there",
    "when", "where", "why", "how", "what", "which", "who", "whom",
    "and", "or", "but", "if", "then", "than", "as", "like",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z\s']/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));

  const freq: Record<string, number> = {};
  for (const w of words) {
    freq[w] = (freq[w] ?? 0) + 1;
  }

  const keywords = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([w]) => w);

  return keywords.length > 0 ? keywords : [text.toLowerCase().split(/\s+/)[0] ?? "word"];
}

function getSituation(text: string, difficulty: string, topic: string): string {
  const topicKey = Object.keys(TOPIC_SITUATIONS).find((k) =>
    topic.toLowerCase().includes(k),
  );
  if (topicKey && topicKey !== "general") {
    return TOPIC_SITUATIONS[topicKey]!;
  }

  const templates = SITUATION_TEMPLATES[difficulty] ?? SITUATION_TEMPLATES.A2!;
  const idx = text.length % templates.length;
  return templates[idx]!;
}

function generateReflexData(phrase: PhraseRow): ReflexData {
  const { en_text, difficulty, topic } = phrase;
  const alternatives: string[] = [];

  const contractionAlt = toContractions(en_text);
  if (contractionAlt.toLowerCase() !== en_text.toLowerCase()) {
    alternatives.push(contractionAlt);
  }

  for (const alt of toModalAlternatives(en_text)) {
    alternatives.push(alt);
  }
  for (const alt of toGreetingAlternatives(en_text)) {
    alternatives.push(alt);
  }
  for (const alt of toPolitenessAlternatives(en_text)) {
    alternatives.push(alt);
  }

  const uniqueAlts = [...new Set(alternatives)].slice(0, 3);

  // Always ensure at least one alternative (original text as fallback)
  if (uniqueAlts.length === 0) {
    uniqueAlts.push(en_text);
  }

  const situation = getSituation(en_text, difficulty, topic);
  const keywords = extractKeywords(en_text);

  return {
    en_alternatives: uniqueAlts,
    situation_en: situation,
    keywords,
  };
}

async function main() {
  loadEnv();
  const admin = makeAdminClient();

  console.log(`=== Reflex Template Generator ===`);

  const PAGE_SIZE = 500;
  let page = 0;
  const allPhrases: PhraseRow[] = [];

  while (true) {
    const { data, error } = await admin
      .from("phrases")
      .select("id,vi_text,en_text,difficulty,topic")
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw error;
    const batch = (data ?? []) as PhraseRow[];
    if (batch.length === 0) break;
    allPhrases.push(...batch);
    page++;
  }

  const phrases = allPhrases;
  console.log(`Fetched ${phrases.length} phrases from DB`);

  let updated = 0;
  let skipped = 0;
  const batchSize = 100;

  for (let i = 0; i < phrases.length; i += batchSize) {
    const batch = phrases.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(phrases.length / batchSize);

    for (const phrase of batch) {
      const reflexData = generateReflexData(phrase);

      const { error: updateError } = await admin
        .from("phrases")
        .update({
          en_alternatives: reflexData.en_alternatives,
          situation_en: reflexData.situation_en,
          keywords: reflexData.keywords,
          reflex_reviewed: false,
        })
        .eq("id", phrase.id);

      if (updateError) {
        console.error(`  DB error for ${phrase.id}: ${updateError.message}`);
        skipped++;
      } else {
        updated++;
      }
    }

    console.log(`  [batch ${batchNum}/${totalBatches}] ${batch.length} phrases processed`);
  }

  console.log(`\n===== KET QUA =====`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total: ${phrases.length}`);

  const { data: finalCounts } = await admin
    .from("phrases")
    .select("difficulty,en_alternatives")
    .range(0, 2999);
  if (finalCounts) {
    const byLevel: Record<string, { total: number; withData: number }> = {};
    for (const p of finalCounts) {
      const row = p as { difficulty: string; en_alternatives: string[] };
      const d = row.difficulty;
      if (!byLevel[d]) byLevel[d] = { total: 0, withData: 0 };
      byLevel[d]!.total++;
      if (row.en_alternatives?.length > 0) byLevel[d]!.withData++;
    }
    console.log(`\nCoverage by level:`);
    for (const [d, counts] of Object.entries(byLevel)) {
      console.log(`  ${d}: ${counts.withData}/${counts.total} with en_alternatives`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
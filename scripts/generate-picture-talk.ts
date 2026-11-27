// Picture Talk 52 sets generation with Unsplash images
// Generates: 26 topics × 2 layers (L1, L2) = 52 image sets
// Each set: 4 images with vocab, expected structures, prompts
// Run with: npx tsx scripts/generate-picture-talk.ts

import { loadEnv, requireEnv } from "./lib/env";
loadEnv();

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const groqApiKey = requireEnv("GROQ_API_KEY");

const supabase = createClient(supabaseUrl, supabaseKey);

// 26 topics (13 topics × 2 rounds) - same as reflex
const TOPICS = [
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

const LAYERS = ["L1", "L2"] as const;
const IMAGES_PER_SET = 4;

const PictureTalkImageSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  prompt: z.string().min(20).max(500),
  vocab: z.array(z.string()).min(4).max(8),
  expectedStructures: z.array(z.string()).min(3).max(6),
});

type PictureTalkImage = z.infer<typeof PictureTalkImageSchema>;

interface PictureTalkSet {
  topicId: string;
  layer: "L1" | "L2";
  round: 1 | 2;
  images: PictureTalkImage[];
}

const UNSPLASH_SEARCH_TERMS: Record<string, string[]> = {
  "topic-01-self": ["morning routine bedroom", "coffee kitchen morning", "home workout yoga", "reading bed night"],
  "topic-02-family": ["family breakfast dining table", "family walk park weekend", "family dinner", "family game night"],
  "topic-03-friends": ["friends laughing cafe", "friends board games", "friends hiking", "friends dinner restaurant"],
  "topic-04-work-daily": ["office desk laptop", "team meeting whiteboard", "remote work home office", "coworking space"],
  "topic-05-hobbies": ["reading cozy chair", "painting canvas art", "gardening backyard", "playing guitar"],
  "topic-06-food": ["vietnamese pho bowl", "cooking kitchen vegetables", "street food market", "family dinner table"],
  "topic-07-home": ["modern apartment living room", "balcony plants city view", "bedroom interior", "home office setup"],
  "topic-08-love": ["couple walking beach sunset", "couple cooking together", "anniversary dinner", "long distance call"],
  "topic-09-health": ["jogging park morning", "meditation yoga", "healthy meal prep", "fitness tracker"],
  "topic-10-travel": ["backpacker city map", "airport departure board", "hotel room view", "local market exploration"],
  "topic-11-money": ["budget planning calculator", "online banking mobile", "grocery shopping list", "investment portfolio"],
  "topic-12-tech": ["coding laptop multiple monitors", "smartphone apps", "vr headset gaming", "tech desk setup"],
  "topic-13-dreams": ["city skyline rooftop sunset", "vision board planning", "goal setting journal", "future career path"],
};

const LAYER_STRUCTURES: Record<"L1" | "L2", string[]> = {
  L1: [
    "I usually...",
    "Every day I...",
    "My routine is...",
    "I like to...",
    "In my free time...",
    "I enjoy...",
  ],
  L2: [
    "First...",
    "Then...",
    "After that...",
    "Finally...",
    "It was...",
    "I felt...",
    "I remember...",
    "Looking back...",
  ],
};

function jsArrayToPgArray(arr: string[]): string {
  return "{" + arr.map(s => '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"').join(",") + "}";
}

function buildPrompt(topic: typeof TOPICS[0], layer: "L1" | "L2"): string {
  const baseTopic = topic.id.replace("-r2", "").replace("topic-", "");
  const searchTerms = UNSPLASH_SEARCH_TERMS[topic.id.replace("-r2", "")] || UNSPLASH_SEARCH_TERMS["topic-01-self"];
  
  return `Generate ${IMAGES_PER_SET} Picture Talk images for Vietnamese English learners.

TOPIC: ${topic.name} (Round ${topic.round}, Layer ${layer})
IMAGES NEEDED: ${IMAGES_PER_SET}
SEARCH CONTEXTS: ${searchTerms.join(", ")}

REQUIREMENTS PER IMAGE:
- id: unique identifier like "pic-${baseTopic}-${layer.toLowerCase()}-1"
- url: Unsplash photo URL (use https://images.unsplash.com/photo-XXXXXX?w=800&q=80 format with real photo IDs)
- prompt: Detailed scene description for learner to describe (30-200 chars)
- vocab: 4-8 key vocabulary words/phrases from the scene
- expectedStructures: 3-6 grammar structures appropriate for ${layer}

LAYER ${layer} GUIDELINES:
${layer === "L1" ? 
  "- Present simple, present continuous\n- Likes/dislikes, habits, routines\n- Basic descriptions (there is/are, have/has)\n- Vocabulary: everyday objects, actions, places" :
  "- Past simple, past continuous, present perfect\n- Sequencing (first, then, after, finally)\n- Narrative tenses, storytelling\n- Vocabulary: feelings, sequences, experiences"}

CONSTRAINTS:
- URLs must be real Unsplash photo IDs (not placeholders)
- Prompts should be vivid and descriptive
- Vocab must be useful for English learners at ${layer === "L1" ? "A1/A2" : "A2/B1"} level
- Structures must match the layer's grammar focus
- Return JSON array of ${IMAGES_PER_SET} objects exactly

Return: [{"id": "...", "url": "...", "prompt": "...", "vocab": [...], "expectedStructures": [...]}]`;
}

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b";
  
  const maxRetries = 5;
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" },
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let error: any;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText };
      }
      
      if (response.status === 429) {
        const retryAfter = error.error?.message?.match(/try again in ([\d.]+)s/) ? 
          parseFloat(error.error.message.match(/try again in ([\d.]+)s/)?.[1] || "5") * 1000 : 
          Math.min(1000 * Math.pow(2, attempt), 30000);
        
        console.log(`  ⏳ Rate limited, waiting ${Math.round(retryAfter / 1000)}s before retry ${attempt + 1}/${maxRetries}...`);
        await new Promise(r => setTimeout(r, retryAfter));
        continue;
      }
      
      throw new Error(`Groq API error: ${response.status} - ${error.error?.message || errorText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
  
  throw lastError || new Error("Max retries exceeded");
}

function cleanJson(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "").replace(/\n```$/, "").trim();
  }
  // Handle if response is wrapped in object with key
  if (cleaned.startsWith("{")) {
    const parsed = JSON.parse(cleaned);
    if (parsed.images) return JSON.stringify(parsed.images);
    if (parsed.data) return JSON.stringify(parsed.data);
    if (Array.isArray(parsed)) return JSON.stringify(parsed);
    // Find first array value
    for (const v of Object.values(parsed)) {
      if (Array.isArray(v)) return JSON.stringify(v);
    }
  }
  return cleaned;
}

async function generateSetWithRetry(topic: typeof TOPICS[0], layer: "L1" | "L2", maxRetries = 2): Promise<PictureTalkImage[]> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await callGroq(
        "You are an expert English curriculum designer creating Picture Talk materials for Vietnamese learners. Generate authentic, varied scenes with real Unsplash URLs. Return ONLY valid JSON array.",
        buildPrompt(topic, layer)
      );
      
      const cleaned = cleanJson(response);
      const parsed = JSON.parse(cleaned);
      
      // Validate each image
      const validated = parsed.map((img: any, i: number) => {
        const validatedImg = PictureTalkImageSchema.parse({
          ...img,
          id: img.id || `pic-${topic.id.replace("-r2", "").replace("topic-", "")}-${layer.toLowerCase()}-${i + 1}`,
        });
        return validatedImg;
      });
      
      return validated;
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`  ❌ ${topic.id} ${layer} failed after ${maxRetries + 1} attempts:`, error);
        return generateFallbackSet(topic, layer);
      }
      await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  
  return generateFallbackSet(topic, layer);
}

function generateFallbackSet(topic: typeof TOPICS[0], layer: "L1" | "L2"): PictureTalkImage[] {
  const baseTopic = topic.id.replace("-r2", "").replace("topic-", "");
  const searchTerms = UNSPLASH_SEARCH_TERMS[topic.id.replace("-r2", "")] || UNSPLASH_SEARCH_TERMS["topic-01-self"];
  const structures = LAYER_STRUCTURES[layer];
  
  const fallbackImages: Record<string, PictureTalkImage[]> = {
    "topic-01-self": [
      { id: `pic-self-${layer.toLowerCase()}-1`, url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80", prompt: "A person waking up in a bright bedroom, stretching, sunlight through curtains", vocab: ["wake up", "stretch", "sunlight", "curtains", "bedroom", "morning"], expectedStructures: layer === "L1" ? ["I usually...", "Every morning I...", "My routine is..."] : ["First...", "Then...", "After that...", "Finally...", "It was...", "I felt..."] },
      { id: `pic-self-${layer.toLowerCase()}-2`, url: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80", prompt: "Someone making coffee in a modern kitchen, pouring into a mug", vocab: ["make coffee", "pour", "kitchen", "mug", "morning routine", "caffeine"], expectedStructures: layer === "L1" ? ["I always...", "First I...", "Then I..."] : ["First...", "Then...", "After that...", "Finally...", "It was...", "I felt..."] },
      { id: `pic-self-${layer.toLowerCase()}-3`, url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80", prompt: "Person exercising at home, yoga mat, stretching, morning workout", vocab: ["exercise", "yoga", "stretch", "workout", "fitness", "mat"], expectedStructures: layer === "L1" ? ["I exercise for...", "I do...", "It takes me..."] : ["First...", "Then...", "After that...", "Finally...", "It was...", "I felt..."] },
      { id: `pic-self-${layer.toLowerCase()}-4`, url: "https://images.unsplash.com/photo-1556906781-9a4129ead1c9?w=800&q=80", prompt: "Person reading a book in bed at night, lamp on, cozy bedroom", vocab: ["read", "book", "bed", "night", "lamp", "cozy", "bedtime", "routine"], expectedStructures: layer === "L1" ? ["I read...", "Before bed I...", "My night routine is..."] : ["First...", "Then...", "After that...", "Finally...", "It was...", "I felt..."] },
    ],
    "topic-02-family": [
      { id: `pic-family-${layer.toLowerCase()}-1`, url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80", prompt: "Family having breakfast together, parents and kids at dining table", vocab: ["family", "breakfast", "together", "parents", "children", "table", "eat"], expectedStructures: layer === "L1" ? ["We have...", "My family...", "There are... people in my family"] : ["First...", "Then...", "After that...", "Finally...", "It was...", "I felt..."] },
      { id: `pic-family-${layer.toLowerCase()}-2`, url: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&q=80", prompt: "Family walking in park on weekend, parents holding kids hands", vocab: ["walk", "park", "weekend", "hold hands", "outdoor", "together", "happy"], expectedStructures: layer === "L1" ? ["On weekends we...", "We like to...", "Sometimes we..."] : ["First...", "Then...", "After that...", "Finally...", "It was...", "I felt..."] },
      { id: `pic-family-${layer.toLowerCase()}-3`, url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80", prompt: "Family dinner with multiple generations, grandparents, parents, children", vocab: ["grandparents", "generations", "dinner", "family", "tradition", "meal", "together"], expectedStructures: layer === "L1" ? ["We have...", "My family...", "There are... people in my family"] : ["First...", "Then...", "After that...", "Finally...", "It was...", "I felt..."] },
      { id: `pic-family-${layer.toLowerCase()}-4`, url: "https://images.unsplash.com/photo-1601056233469-69a4b34e1e22?w=800&q=80", prompt: "Family playing board games on living room floor, laughing", vocab: ["board game", "play", "laugh", "family", "fun", "evening", "together"], expectedStructures: layer === "L1" ? ["We play...", "We like to...", "It's fun when..."] : ["First...", "Then...", "After that...", "Finally...", "It was...", "I felt..."] },
    ],
  };
  
  const topicKey = topic.id.replace("-r2", "");
  const fallbacks = fallbackImages[topicKey] || fallbackImages["topic-01-self"];
  
  return fallbacks.map((img, i) => ({
    ...img,
    id: `pic-${baseTopic}-${layer.toLowerCase()}-${i + 1}`,
    prompt: layer === "L2" ? `${img.prompt}. Tell a story about what happened before or after.` : img.prompt,
    expectedStructures: structures,
  }));
}

async function main() {
  console.log("🚀 Picture Talk Generation (52 sets = 26 topics × 2 layers)\n");
  
  // Check existing
  const { data: existing } = await supabase.from("picture_talk_sets").select("topic_id, layer");
  const existingKeys = new Set(existing?.map(s => `${s.topic_id}-${s.layer}`) || []);
  console.log(`📊 Existing sets in DB: ${existingKeys.size}\n`);
  
  let allSets: (PictureTalkSet & { imageSetId: string; created_at: string })[] = [];
  let totalGenerated = 0;
  let totalSkipped = 0;
  
  for (let i = 0; i < TOPICS.length; i++) {
    const topic = TOPICS[i];
    console.log(`\n📝 Topic ${i + 1}/26: ${topic.name} (${topic.id})`);
    
    for (const layer of LAYERS) {
      const key = `${topic.id}-${layer}`;
      if (existingKeys.has(key)) {
        console.log(`  ⏭️  ${layer}: already exists, skipping`);
        totalSkipped++;
        continue;
      }
      
      console.log(`  🎨 ${layer}: generating ${IMAGES_PER_SET} images...`);
      const images = await generateSetWithRetry(topic, layer);
      
      const imageSetId = `pic-${topic.id.replace("-r2", "").replace("topic-", "")}-${layer.toLowerCase()}`;
      
      allSets.push({
        topicId: topic.id,
        layer,
        round: topic.round as 1 | 2,
        images,
        imageSetId,
        created_at: new Date().toISOString(),
      });
      
      totalGenerated++;
      console.log(`  ✅ ${layer}: ${images.length} images generated`);
      
      // Rate limit delay
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  console.log(`\n📊 Summary: ${totalGenerated} new sets, ${totalSkipped} skipped (existing)`);
  
  if (allSets.length === 0) {
    console.log("✅ Nothing to insert. All sets already exist.");
    return;
  }
  
  // Convert to DB format
  const dbSets = allSets.map(s => ({
    topic_id: s.topicId,
    layer: s.layer,
    round_num: s.round,
    image_set_id: s.imageSetId,
    images: s.images,
    created_at: s.created_at,
  }));
  
  // Batch insert
  const batchSize = 10;
  let inserted = 0;
  
  for (let i = 0; i < dbSets.length; i += batchSize) {
    const batch = dbSets.slice(i, i + batchSize);
    const { error } = await supabase.from("picture_talk_sets").upsert(batch, { onConflict: "image_set_id" });
    if (error) {
      console.error(`❌ Batch ${i / batchSize + 1} failed:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`✅ Batch ${i / batchSize + 1} inserted (${batch.length} sets)`);
    }
  }
  
  console.log(`\n🎉 Complete! ${inserted} Picture Talk sets inserted into database.`);
}

main().catch(console.error);
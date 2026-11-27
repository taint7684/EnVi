// AI-powered batch generation of 1,456 reflex phrases (26 topics × 7 days × 8 phrases)
// Direct Groq API call with structured output
// Run with: npx tsx scripts/generate-reflex-phrases-ai.ts

import { config } from "dotenv";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
config({ path: ".env.local" });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const groqApiKey = process.env.GROQ_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials. Ensure .env.local is loaded.");
  process.exit(1);
}

if (!groqApiKey) {
  console.error("Missing GROQ_API_KEY. Ensure .env.local is loaded.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 26 topics (13 topics × 2 rounds)
const TOPICS = [
  // Round 1 - Basic
  { id: "topic-01-self", name: "Self & Routine", round: 1, level: "L1" as const },
  { id: "topic-02-family", name: "Family", round: 1, level: "L1" as const },
  { id: "topic-03-friends", name: "Friends & Communication", round: 1, level: "L1" as const },
  { id: "topic-04-work-daily", name: "Daily Work", round: 1, level: "L1" as const },
  { id: "topic-05-hobbies", name: "Hobbies & Free Time", round: 1, level: "L1" as const },
  { id: "topic-06-food", name: "Food & Cooking", round: 1, level: "L1" as const },
  { id: "topic-07-home", name: "Home & Living", round: 1, level: "L1" as const },
  { id: "topic-08-love", name: "Love & Relationships", round: 1, level: "L1" as const },
  { id: "topic-09-health", name: "Health & Emotions", round: 1, level: "L1" as const },
  { id: "topic-10-travel", name: "Travel", round: 1, level: "L1" as const },
  { id: "topic-11-money", name: "Money & Shopping", round: 1, level: "L1" as const },
  { id: "topic-12-tech", name: "Tech & Phone", round: 1, level: "L1" as const },
  { id: "topic-13-dreams", name: "Plans & Dreams", round: 1, level: "L1" as const },
  // Round 2 - Advanced
  { id: "topic-01-self-r2", name: "Self & Routine (Advanced)", round: 2, level: "L2" as const },
  { id: "topic-02-family-r2", name: "Family (Advanced)", round: 2, level: "L2" as const },
  { id: "topic-03-friends-r2", name: "Friends & Networking", round: 2, level: "L2" as const },
  { id: "topic-04-work-daily-r2", name: "Advanced Work", round: 2, level: "L2" as const },
  { id: "topic-05-hobbies-r2", name: "Professional Hobbies", round: 2, level: "L2" as const },
  { id: "topic-06-food-r2", name: "Food Culture", round: 2, level: "L2" as const },
  { id: "topic-07-home-r2", name: "Workspace", round: 2, level: "L2" as const },
  { id: "topic-08-love-r2", name: "Long-term Relationships", round: 2, level: "L2" as const },
  { id: "topic-09-health-r2", name: "Sustainable Health", round: 2, level: "L2" as const },
  { id: "topic-10-travel-r2", name: "Business Travel", round: 2, level: "L2" as const },
  { id: "topic-11-money-r2", name: "Personal Finance", round: 2, level: "L2" as const },
  { id: "topic-12-tech-r2", name: "Advanced Tech", round: 2, level: "L2" as const },
  { id: "topic-13-dreams-r2", name: "5-Year Plan", round: 2, level: "L2" as const },
];

const SENTENCE_TYPES = ["qa", "situation", "continue", "paraphrase", "circumlocution"] as const;

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
  audio_url: z.string().nullable().optional().describe("Will be generated separately via TTS"),
  situation_en: z.string().min(10).max(300).describe("English situation/context for the learner"),
  en_alternatives: z.array(z.string()).min(1).max(5).describe("2-5 natural alternative English responses"),
  keywords: z.array(z.string()).min(2).max(6).describe("2-6 key vocabulary words from the phrase"),
  sentence_type: z.enum(SENTENCE_TYPES),
  difficulty: z.string().refine(val => ["A1", "A2", "B1", "B2"].includes(val), {
    message: "Invalid difficulty level"
  }),
  level: z.enum(["L1", "L2", "L3"]),
  topic: z.string(),
  reflex_reviewed: z.boolean().default(false),
});

type ReflexPhrase = z.infer<typeof ReflexPhraseSchema>;

function jsArrayToPgArray(arr: string[]): string {
  return "{" + arr.map(s => '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"').join(",") + "}";
}

function buildPrompt(topic: typeof TOPICS[0], day: number, sentenceType: typeof SENTENCE_TYPES[0]): string {
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

async function callGroq(systemPrompt: string, userPrompt: string): Promise<string> {
  const model = process.env.GROQ_MODEL || "openai/gpt-oss-20b"; // Use gpt-oss-20b for free tier
  
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
        max_tokens: 800,
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
      
      // Handle rate limiting with exponential backoff
      if (response.status === 429) {
        const retryAfter = error.error?.message?.match(/try again in ([\d.]+)s/) ? 
          parseFloat(error.error.message.match(/try again in ([\d.]+)s/)?.[1] || "5") * 1000 : 
          Math.min(1000 * Math.pow(2, attempt), 30000);
        
        console.log(`  ⏳ Rate limited, waiting ${Math.round(retryAfter / 1000)}s before retry ${attempt + 1}/${maxRetries}...`);
        await new Promise(r => setTimeout(r, retryAfter));
        continue;
      }
      
      // Handle other errors
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
  return cleaned;
}

async function generatePhraseWithRetry(topic: typeof TOPICS[0], day: number, sentenceType: typeof SENTENCE_TYPES[0], maxRetries = 2): Promise<ReflexPhrase> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await callGroq(
        "You are an expert English teacher creating natural spoken English phrases for Vietnamese learners. Generate authentic, conversational English that sounds native. Return ONLY valid JSON.",
        buildPrompt(topic, day, sentenceType)
      );
      
      const cleaned = cleanJson(response);
      const parsed = JSON.parse(cleaned);
      const validated = ReflexPhraseSchema.parse(parsed);
      
      // Ensure audio_url is null (not undefined) for database
      return {
        ...validated,
        audio_url: validated.audio_url ?? null,
        topic: topic.id,
      };
    } catch (error) {
      if (attempt === maxRetries) {
        console.error(`  ❌ ${topic.id} Day ${day + 1} ${sentenceType} failed after ${maxRetries + 1} attempts:`, error);
        return generateFallbackPhrase(topic, day, 0, sentenceType);
      }
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  
  // Should never reach here
  return generateFallbackPhrase(topic, day, 0, sentenceType);
}

async function generatePhraseBatch(topic: typeof TOPICS[0], day: number): Promise<ReflexPhrase[]> {
  // Generate 8 phrases (one per sentence type, cycling through)
  const phrases: ReflexPhrase[] = [];
  
  for (let i = 0; i < 8; i++) {
    const sentenceType = SENTENCE_TYPES[i % 5] as typeof SENTENCE_TYPES[0];
    
    const phrase = await generatePhraseWithRetry(topic, day, sentenceType);
    phrases.push(phrase);
    
    console.log(`  ✅ ${topic.id} Day ${day + 1} ${sentenceType}: "${phrase.en_text.substring(0, 50)}..."`);
    
    // Longer delay to avoid rate limits (Groq free tier: 8000 TPM)
    await new Promise(r => setTimeout(r, 2000));
  }
  
  return phrases;
}

function generateFallbackPhrase(topic: typeof TOPICS[0], day: number, phraseNum: number, sentenceType: typeof SENTENCE_TYPES[0]): ReflexPhrase {
  const templates: Record<string, any> = {
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
    "Friends & Communication": {
      qa: { vi: "Tôi thường gặp bạn bè vào cuối tuần.", en: "I usually meet friends on weekends.", sit: "When do you hang out with friends?", alt: ["We get together on weekends.", "Weekend is friend time."], kw: ["meet", "friends", "weekend"] },
      situation: { vi: "Chúng tôi nhắn tin hàng ngày.", en: "We text each other daily.", sit: "How do you stay in touch with friends?", alt: ["We message every day.", "Daily texts keep us close."], kw: ["text", "daily", "touch"] },
      continue: { vi: "Cuối tuần đi cafe cùng nhau.", en: "We grab coffee together on weekends.", sit: "What's your typical weekend plan?", alt: ["Weekend coffee is our thing.", "We catch up over coffee."], kw: ["grab", "coffee", "weekend"] },
      paraphrase: { vi: "Bạn thân tôi luôn lắng nghe.", en: "My best friend always listens.", sit: "Describe a good friend differently.", alt: ["My close friend hears me out.", "Best friends listen well."], kw: ["best", "friend", "listen"] },
      circumlocution: { vi: "Chúng tôi chia sẻ mọi thứ.", en: "We share everything with each other.", sit: "How close are you and your friends?", alt: ["Nothing's off limits between us.", "We tell each other everything."], kw: ["share", "everything"] },
    },
    "Daily Work": {
      qa: { vi: "Tôi bắt đầu làm việc lúc 8 giờ.", en: "I start work at 8 AM.", sit: "What time does your workday begin?", alt: ["My shift starts at 8.", "I'm at my desk by 8."], kw: ["start", "work", "8"] },
      situation: { vi: "Tôi kiểm tra email trước tiên.", en: "I check emails first thing.", sit: "What's the first task at work?", alt: ["Emails are my first priority.", "I open my inbox immediately."], kw: ["check", "emails", "first"] },
      continue: { vi: "Buổi sáng tập trung vào dự án lớn.", en: "Mornings are for deep work.", sit: "How do you structure your morning?", alt: ["I do focused work in the AM.", "Deep work happens early."], kw: ["mornings", "deep", "work"] },
      paraphrase: { vi: "Tôi nghỉ trưa một tiếng.", en: "I take an hour for lunch.", sit: "How long is your lunch break?", alt: ["Lunch break is one hour.", "I get 60 minutes for lunch."], kw: ["hour", "lunch", "break"] },
      circumlocution: { vi: "Cuối ngày tôi xem lại tiến độ.", en: "I review progress at day's end.", sit: "What's your end-of-day routine?", alt: ["I check what got done.", "End of day means review time."], kw: ["review", "progress", "end"] },
    },
    "Hobbies & Free Time": {
      qa: { vi: "Tôi thích đọc sách vào tối.", en: "I like reading at night.", sit: "What do you do to relax?", alt: ["Reading's my evening thing.", "I unwind with a book."], kw: ["reading", "night", "relax"] },
      situation: { vi: "Cuối tuần tôi đi chơi game.", en: "Weekends are for gaming.", sit: "How do you spend free time?", alt: ["I game on weekends.", "Gaming is my weekend plan."], kw: ["gaming", "weekend"] },
      continue: { vi: "Tôi cũng thích nấu ăn.", en: "I enjoy cooking too.", sit: "What other hobbies do you have?", alt: ["Cooking's another hobby.", "I like to cook as well."], kw: ["cooking", "hobby", "enjoy"] },
      paraphrase: { vi: "Sách giúp tôi thư giãn.", en: "Books help me unwind.", sit: "Why do you like reading?", alt: ["Reading calms me down.", "It's my stress relief."], kw: ["books", "unwind", "relax"] },
      circumlocution: { vi: "Tôi làm vườn cuối tuần.", en: "I do gardening on weekends.", sit: "What outdoor activity do you enjoy?", alt: ["Weekend gardening is my thing.", "I tend to plants on days off."], kw: ["gardening", "weekend", "plants"] },
    },
    "Food & Cooking": {
      qa: { vi: "Món yêu thích của tôi là phở.", en: "My favorite dish is pho.", sit: "What's your go-to comfort food?", alt: ["Pho is my top pick.", "I'd choose pho any day."], kw: ["favorite", "dish", "pho"] },
      situation: { vi: "Tôi nấu cơm mỗi tối.", en: "I cook dinner every night.", sit: "How often do you cook?", alt: ["Daily cooking is my routine.", "I make dinner every evening."], kw: ["cook", "dinner", "every"] },
      continue: { vi: "Tôi thêm nhiều rau xanh.", en: "I add lots of veggies.", sit: "What's your cooking style?", alt: ["Lots of greens in my meals.", "Vegetables are a must."], kw: ["add", "veggies", "lots"] },
      paraphrase: { vi: "Món này nấu rất nhanh.", en: "This dish cooks up fast.", sit: "Describe a quick meal differently.", alt: ["It's ready in minutes.", "Super quick to make."], kw: ["cooks", "fast", "quick"] },
      circumlocution: { vi: "Tôi dùng xì dầu và tỏi.", en: "I use fish sauce and garlic.", sit: "What are essential Vietnamese ingredients?", alt: ["Fish sauce and garlic are key.", "Can't cook without them."], kw: ["fish sauce", "garlic", "essential"] },
    },
    "Home & Living": {
      qa: { vi: "Tôi sống trong một căn hộ nhỏ.", en: "I live in a small apartment.", sit: "What's your living situation?", alt: ["My place is a small flat.", "I rent a compact apartment."], kw: ["live", "apartment", "small"] },
      situation: { vi: "Tôi dọn dẹp vào cuối tuần.", en: "I clean on weekends.", sit: "When do you do housework?", alt: ["Weekend cleaning is my routine.", "Saturdays are for chores."], kw: ["clean", "weekend", "chores"] },
      continue: { vi: "Căn bếp khá nhỏ nhưng đủ dùng.", en: "The kitchen's small but functional.", sit: "Describe your kitchen.", alt: ["It's a compact kitchen.", "Small kitchen, works fine."], kw: ["kitchen", "small", "functional"] },
      paraphrase: { vi: "Tôi thích không gian yên tĩnh.", en: "I prefer a quiet space.", sit: "What's your ideal home vibe?", alt: ["Quiet is what I need.", "Peace and quiet at home."], kw: ["quiet", "space", "prefer"] },
      circumlocution: { vi: "Ban công có nhiều cây xanh.", en: "The balcony has lots of plants.", sit: "What's on your balcony?", alt: ["Plants everywhere on the balcony.", "It's a green balcony."], kw: ["balcony", "plants", "green"] },
    },
    "Love & Relationships": {
      qa: { vi: "Chúng tôi đã yêu nhau 3 năm.", en: "We've been together for 3 years.", sit: "How long have you been dating?", alt: ["Three years and counting.", "It's been three years."], kw: ["together", "years", "three"] },
      situation: { vi: "Chúng tôi đi dạo tối thứ 7.", en: "We take evening walks on Saturdays.", sit: "What's your couple routine?", alt: ["Saturday walks are our thing.", "We stroll together weekends."], kw: ["walks", "evening", "Saturdays"] },
      continue: { vi: "Chúng tôi nấu ăn cho nhau.", en: "We cook for each other.", sit: "How do you show care?", alt: ["Cooking is our love language.", "We make meals for one another."], kw: ["cook", "each other", "care"] },
      paraphrase: { vi: "Tình yêu cần sự thấu hiểu.", en: "Love takes understanding.", sit: "What makes a relationship work?", alt: ["Understanding is key in love.", "You gotta understand each other."], kw: ["love", "understanding", "key"] },
      circumlocution: { vi: "Chúng tôi cãi nhau đôi khi.", en: "We argue sometimes.", sit: "Do couples ever disagree?", alt: ["Arguments happen.", "We fight occasionally."], kw: ["argue", "sometimes", "disagree"] },
    },
    "Health & Emotions": {
      qa: { vi: "Tôi cố gắng ngủ trước 11 giờ.", en: "I try to sleep before 11.", sit: "What's your bedtime goal?", alt: ["Before 11 is my target.", "I aim for early sleep."], kw: ["sleep", "before", "11"] },
      situation: { vi: "Khi stress tôi đi dạo.", en: "When stressed, I go for a walk.", sit: "How do you handle stress?", alt: ["Walking clears my head.", "A walk helps with stress."], kw: ["stressed", "walk", "clear"] },
      continue: { vi: "Tôi thiền 10 phút mỗi sáng.", en: "I meditate 10 minutes each morning.", sit: "What's your mental health routine?", alt: ["Daily meditation keeps me calm.", "10 minutes of mindfulness."], kw: ["meditate", "minutes", "morning"] },
      paraphrase: { vi: "Cảm xúc lên xuống là bình thường.", en: "Mood swings are normal.", sit: "How do you view emotional ups and downs?", alt: ["It's normal to have ups and downs.", "Feelings fluctuate naturally."], kw: ["mood", "normal", "swings"] },
      circumlocution: { vi: "Tôi viết nhật ký để xử lý cảm xúc.", en: "I journal to process feelings.", sit: "How do you deal with emotions?", alt: ["Writing helps me sort feelings.", "Journaling is my outlet."], kw: ["journal", "process", "feelings"] },
    },
    "Travel": {
      qa: { vi: "Tôi muốn đi Đà Nẵng mùa hè này.", en: "I want to visit Da Nang this summer.", sit: "Where's your next trip?", alt: ["Da Nang is on my list.", "Planning a Da Nang trip."], kw: ["visit", "Da Nang", "summer"] },
      situation: { vi: "Tôi thích du lịch một mình.", en: "I enjoy solo travel.", sit: "Do you travel alone or with others?", alt: ["Solo trips are my preference.", "I like traveling by myself."], kw: ["solo", "travel", "alone"] },
      continue: { vi: "Tôi thường đặt vé trước 1 tháng.", en: "I usually book flights a month ahead.", sit: "How far in advance do you plan?", alt: ["Booking early saves money.", "A month out is my sweet spot."], kw: ["book", "flights", "month"] },
      paraphrase: { vi: "Vali của tôi luôn nhẹ.", en: "I always pack light.", sit: "What's your packing style?", alt: ["Light packing is my rule.", "Carry-on only for me."], kw: ["pack", "light", "always"] },
      circumlocution: { vi: "Tôi chụp ảnh mọi nơi tôi đến.", en: "I take photos everywhere I go.", sit: "Do you document your travels?", alt: ["Photos at every stop.", "Camera's always ready."], kw: ["photos", "everywhere", "go"] },
    },
    "Money & Shopping": {
      qa: { vi: "Tôi tiết kiệm 20% lương hàng tháng.", en: "I save 20% of my salary monthly.", sit: "How much do you save?", alt: ["20% goes to savings.", "A fifth of my pay is saved."], kw: ["save", "20", "salary"] },
      situation: { vi: "Tôi so sánh giá trước khi mua.", en: "I compare prices before buying.", sit: "Are you a smart shopper?", alt: ["Price comparison is a must.", "I always check for deals."], kw: ["compare", "prices", "buy"] },
      continue: { vi: "Tôi dùng ví điện tử để chi tiêu.", en: "I use e-wallet for spending.", sit: "How do you pay for things?", alt: ["Digital wallet is my go-to.", "Phone payments all the way."], kw: ["e-wallet", "spending", "pay"] },
      paraphrase: { vi: "Đầu tư sớm là quan trọng.", en: "Early investing matters.", sit: "Why start investing young?", alt: ["Time in market beats timing.", "Compound interest needs time."], kw: ["investing", "early", "important"] },
      circumlocution: { vi: "Tôi tránh mua sắm bốc đồng.", en: "I avoid impulse purchases.", sit: "How do you control spending?", alt: ["No impulse buys for me.", "I think before I spend."], kw: ["avoid", "impulse", "purchases"] },
    },
    "Tech & Phone": {
      qa: { vi: "Tôi dùng iPhone 14 Pro.", en: "I use an iPhone 14 Pro.", sit: "What phone do you have?", alt: ["iPhone 14 Pro is my device.", "Rocking the 14 Pro."], kw: ["iPhone", "14 Pro", "use"] },
      situation: { vi: "Tôi kiểm tra tin nhắn ngay khi thức dậy.", en: "I check messages right after waking.", sit: "First thing you do on your phone?", alt: ["Messages first thing.", "Notifications check immediately."], kw: ["check", "messages", "waking"] },
      continue: { vi: "Tôi dùng app ngân hàng hàng ngày.", en: "I use banking apps daily.", sit: "What apps do you use most?", alt: ["Banking app every day.", "Finance apps are essential."], kw: ["banking", "apps", "daily"] },
      paraphrase: { vi: "Điện thoại là phần mở rộng của tay.", en: "Phone's like an extension of my hand.", sit: "How attached are you to your phone?", alt: ["Can't function without it.", "It's practically attached."], kw: ["phone", "extension", "hand"] },
      circumlocution: { vi: "Tôi tắt thông báo sau 10 giờ tối.", en: "I turn off notifications after 10 PM.", sit: "Do you set phone boundaries?", alt: ["Notifications off at night.", "Silent mode after 10."], kw: ["notifications", "off", "10 PM"] },
    },
    "Plans & Dreams": {
      qa: { vi: "Mục tiêu năm nay là thăng chức.", en: "This year's goal is a promotion.", sit: "What's your big goal?", alt: ["Aiming for a promotion.", "Promotion is the target."], kw: ["goal", "promotion", "year"] },
      situation: { vi: "Tôi học tiếng Anh 30 phút mỗi ngày.", en: "I study English 30 minutes daily.", sit: "What habit are you building?", alt: ["Daily English practice.", "Half hour of English every day."], kw: ["study", "English", "daily"] },
      continue: { vi: "Tôi muốn mở quán cafe sau 5 năm.", en: "I want to open a cafe in 5 years.", sit: "What's your long-term dream?", alt: ["Cafe owner in 5 years.", "Dreaming of my own cafe."], kw: ["cafe", "5 years", "open"] },
      paraphrase: { vi: "Kế hoạch cần hành động mới thành hiện thực.", en: "Plans need action to become real.", sit: "How do you make dreams happen?", alt: ["Action turns plans into reality.", "Without action, plans are just wishes."], kw: ["plans", "action", "real"] },
      circumlocution: { vi: "Tôi viết mục tiêu lên giấy.", en: "I write goals down on paper.", sit: "How do you track goals?", alt: ["Written goals are commitment.", "Paper makes it concrete."], kw: ["write", "goals", "paper"] },
    },
  };
  
  // Map topic IDs to template keys
  const topicNameMap: Record<string, string> = {
    "topic-01-self": "Self & Routine",
    "topic-02-family": "Family",
    "topic-03-friends": "Friends & Communication",
    "topic-04-work-daily": "Daily Work",
    "topic-05-hobbies": "Hobbies & Free Time",
    "topic-06-food": "Food & Cooking",
    "topic-07-home": "Home & Living",
    "topic-08-love": "Love & Relationships",
    "topic-09-health": "Health & Emotions",
    "topic-10-travel": "Travel",
    "topic-11-money": "Money & Shopping",
    "topic-12-tech": "Tech & Phone",
    "topic-13-dreams": "Plans & Dreams",
    "topic-01-self-r2": "Self & Routine",
    "topic-02-family-r2": "Family",
    "topic-03-friends-r2": "Friends & Communication",
    "topic-04-work-daily-r2": "Daily Work",
    "topic-05-hobbies-r2": "Hobbies & Free Time",
    "topic-06-food-r2": "Food & Cooking",
    "topic-07-home-r2": "Home & Living",
    "topic-08-love-r2": "Love & Relationships",
    "topic-09-health-r2": "Health & Emotions",
    "topic-10-travel-r2": "Travel",
    "topic-11-money-r2": "Money & Shopping",
    "topic-12-tech-r2": "Tech & Phone",
    "topic-13-dreams-r2": "Plans & Dreams",
  };
  
  const templateKey = topicNameMap[topic.id] || "Self & Routine";
  const topicTemplates = templates[templateKey] || templates["Self & Routine"];
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
  const { data: existing } = await supabase.from("reflex_phrases").select("id");
  const existingIds = new Set(existing?.map(p => p.id) || []);
  console.log(`📊 Existing phrases in DB: ${existingIds.size}\n`);
  
  let allPhrases: (ReflexPhrase & { id: string; created_at: string })[] = [];
  let totalGenerated = 0;
  let totalSkipped = 0;
  
  for (let i = 0; i < TOPICS.length; i++) {
    const topic = TOPICS[i];
    console.log(`\n📝 Topic ${i + 1}/26: ${topic.name} (${topic.id})`);
    
    const topicPhrases: (ReflexPhrase & { id: string; created_at: string })[] = [];
    
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
    const { error } = await supabase.from("reflex_phrases").upsert(batch, { onConflict: "id" });
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
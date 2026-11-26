#!/usr/bin/env node
// Batch generate 1,440 reflex phrases (8/day × 180 days)
// Run with: node scripts/generate-reflex-phrases.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 13 topics × 2 rounds = 26 topic IDs
const TOPICS = [
  // Round 1
  { id: 'topic-01-self', name: 'Self & Routine', round: 1 },
  { id: 'topic-02-family', name: 'Family', round: 1 },
  { id: 'topic-03-friends', name: 'Friends & Communication', round: 1 },
  { id: 'topic-04-work-daily', name: 'Daily Work', round: 1 },
  { id: 'topic-05-hobbies', name: 'Hobbies & Free Time', round: 1 },
  { id: 'topic-06-food', name: 'Food & Cooking', round: 1 },
  { id: 'topic-07-home', name: 'Home & Living', round: 1 },
  { id: 'topic-08-love', name: 'Love & Relationships', round: 1 },
  { id: 'topic-09-health', name: 'Health & Emotions', round: 1 },
  { id: 'topic-10-travel', name: 'Travel', round: 1 },
  { id: 'topic-11-money', name: 'Money & Shopping', round: 1 },
  { id: 'topic-12-tech', name: 'Tech & Phone', round: 1 },
  { id: 'topic-13-dreams', name: 'Plans & Dreams', round: 1 },
  // Round 2
  { id: 'topic-01-self-r2', name: 'Self & Routine (Advanced)', round: 2 },
  { id: 'topic-02-family-r2', name: 'Family (Advanced)', round: 2 },
  { id: 'topic-03-friends-r2', name: 'Friends & Networking', round: 2 },
  { id: 'topic-04-work-daily-r2', name: 'Advanced Work', round: 2 },
  { id: 'topic-05-hobbies-r2', name: 'Professional Hobbies', round: 2 },
  { id: 'topic-06-food-r2', name: 'Food Culture', round: 2 },
  { id: 'topic-07-home-r2', name: 'Workspace', round: 2 },
  { id: 'topic-08-love-r2', name: 'Long-term Relationships', round: 2 },
  { id: 'topic-09-health-r2', name: 'Sustainable Health', round: 2 },
  { id: 'topic-10-travel-r2', name: 'Business Travel', round: 2 },
  { id: 'topic-11-money-r2', name: 'Personal Finance', round: 2 },
  { id: 'topic-12-tech-r2', name: 'Advanced Tech', round: 2 },
  { id: 'topic-13-dreams-r2', name: '5-Year Plan', round: 2 },
];

const SENTENCE_TYPES = ['qa', 'situation', 'continue', 'paraphrase', 'circumlocution'];

function jsArrayToPgArray(arr) {
  // Convert JS array to PostgreSQL array literal: {item1,item2,item3}
  // Escape double quotes and backslashes
  return '{' + arr.map(s => '"' + s.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"').join(',') + '}';
}

function generatePhrasesForTopic(topic, dayOffset) {
  const phrases = [];
  const baseDay = dayOffset * 7; // 7 days per topic
  
  for (let day = 0; day < 7; day++) {
    for (let phraseNum = 0; phraseNum < 8; phraseNum++) {
      const globalDay = baseDay + day;
      const sentenceType = SENTENCE_TYPES[phraseNum % 5];
      const level = day < 3 ? 'L1' : (day < 5 ? 'L2' : 'L3');
      const difficulty = level === 'L1' ? 'A1' : (level === 'L2' ? 'A2' : 'B1');
      
      const id = `${topic.id}-d${day + 1}-p${phraseNum + 1}`;
      
      // Generate contextual phrases based on topic and sentence type
      const { vi_text, en_text, situation_en, en_alternatives, keywords } = 
        generatePhraseContent(topic.name, sentenceType, day, phraseNum, level, topic.round);
      
      phrases.push({
        id,
        vi_text,
        en_text,
        audio_url: null,
        topic: topic.id,
        difficulty,
        level,
        en_alternatives: jsArrayToPgArray(en_alternatives),
        situation_en,
        keywords: jsArrayToPgArray(keywords),
        reflex_reviewed: false,
        created_at: new Date().toISOString(),
        sentence_type: sentenceType,
      });
    }
  }
  return phrases;
}

function generatePhraseContent(topicName, sentenceType, day, phraseNum, level, round) {
  // This is a simplified generator - in production, use AI (Gemini free tier)
  // For now, return template phrases that will be replaced by AI batch generation
  
  const templates = {
    'Self & Routine': {
      qa: { vi: 'Tôi thường dậy lúc 6 giờ sáng.', en: 'I usually wake up at 6 AM.', sit: 'Your alarm goes off. What time do you wake up?', alt: ['I get up at 6.', "I'm up at 6."], kw: ['wake', '6', 'AM'] },
      situation: { vi: 'Tôi uống cà phê mỗi sáng.', en: 'I drink coffee every morning.', sit: "You're at the kitchen counter. What do you do first?", alt: ['I have coffee daily.', 'Coffee is my morning routine.'], kw: ['drink', 'coffee', 'morning'] },
      continue: { vi: 'Tôi tập thể dục 30 phút.', en: 'I exercise for 30 minutes.', sit: 'Describe your morning routine. What comes after coffee?', alt: ['I work out for half an hour.', 'I do a 30-minute workout.'], kw: ['exercise', '30', 'minutes'] },
      paraphrase: { vi: 'Tôi lên kế hoạch cho ngày.', en: 'I plan my day.', sit: "How do you start your workday? Say it differently.", alt: ['I organize my schedule.', 'I map out my tasks.'], kw: ['plan', 'day'] },
      circumlocution: { vi: 'Tôi ăn trưa tại bàn làm việc.', en: 'I eat lunch at my desk.', sit: "Where do you usually have lunch? Explain without saying 'at my desk'.", alt: ['I have lunch at my desk.', 'Lunch is at my workstation.'], kw: ['eat', 'lunch', 'desk'] },
    },
    'Family': {
      qa: { vi: 'Gia đình tôi có 4 người.', en: 'There are four people in my family.', sit: 'Tell me about your family.', alt: ['My family has four members.', "We're a family of four."], kw: ['four', 'people', 'family'] },
      situation: { vi: 'Cha tôi là kỹ sư.', en: 'My father is an engineer.', sit: 'What does your father do?', alt: ['Dad works as an engineer.', "My dad's an engineer."], kw: ['father', 'engineer'] },
      continue: { vi: 'Chúng tôi ăn tối cùng nhau.', en: 'We have dinner together.', sit: "What's your family routine?", alt: ['We eat dinner as a family.', 'Family dinner is our routine.'], kw: ['dinner', 'together'] },
      paraphrase: { vi: 'Tết là dịp sum họp.', en: 'Tet is for family reunion.', sit: "What's a special family occasion?", alt: ['We gather for Tet.', 'Tet means family time.'], kw: ['Tet', 'reunion', 'family'] },
      circumlocution: { vi: 'Con cái lớn rồi tự lập.', en: 'Kids grow up and become independent.', sit: 'How do family dynamics change?', alt: ['Children eventually leave home.', 'They become independent adults.'], kw: ['kids', 'grow', 'independent'] },
    },
    // Add more topic templates as needed
  };
  
  const topicTemplates = templates[topicName] || templates['Self & Routine'];
  const template = topicTemplates[sentenceType] || topicTemplates.qa;
  
  // Vary content slightly per day/phrase
  const daySuffix = day > 0 ? ` (ngày ${day + 1})` : '';
  const phraseSuffix = phraseNum > 4 ? ` - cách ${phraseNum - 3}` : '';
  
  return {
    vi_text: template.vi + daySuffix + phraseSuffix,
    en_text: template.en + daySuffix + phraseSuffix,
    situation_en: template.sit,
    en_alternatives: template.alt,
    keywords: template.kw,
  };
}

async function main() {
  console.log('🚀 Generating 1,440 reflex phrases...\n');
  
  // First, check existing phrases in DB
  const { data: existing } = await supabase.from('phrases').select('id, topic');
  const existingIds = new Set(existing?.map(p => p.id) || []);
  console.log(`📊 Existing phrases in DB: ${existingIds.size}`);
  
  let allPhrases = [];
  let totalGenerated = 0;
  
  for (let i = 0; i < TOPICS.length; i++) {
    const topic = TOPICS[i];
    const phrases = generatePhrasesForTopic(topic, i);
    const newPhrases = phrases.filter(p => !existingIds.has(p.id));
    
    console.log(`📝 ${topic.name}: ${phrases.length} phrases (${newPhrases.length} new)`);
    allPhrases.push(...newPhrases);
    totalGenerated += newPhrases.length;
  }
  
  console.log(`\n📦 Total new phrases to insert: ${totalGenerated}`);
  
  // Batch insert (50 at a time)
  const batchSize = 50;
  for (let i = 0; i < allPhrases.length; i += batchSize) {
    const batch = allPhrases.slice(i, i + batchSize);
    const { error } = await supabase.from('phrases').insert(batch);
    if (error) {
      console.error(`❌ Batch ${i / batchSize + 1} failed:`, error.message);
    } else {
      console.log(`✅ Batch ${i / batchSize + 1} inserted (${batch.length} phrases)`);
    }
  }
  
  console.log('\n✅ Generation complete!');
}

main().catch(console.error);
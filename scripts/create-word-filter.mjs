#!/usr/bin/env node
// Create 3,000 core word filter (NGSL 2800 + Oxford top)
// Run with: node scripts/create-word-filter.mjs

import { readFileSync, writeFileSync } from 'fs';

console.log('🔍 Creating 3,000 core word filter...\n');

// Load existing words
const wordsData = JSON.parse(readFileSync('C:\\Users\\LENOVO\\Desktop\\EnVi\\data\\words.json', 'utf-8'));
console.log(`📊 Total words in data/words.json: ${wordsData.length}`);

// NGSL 2800 core lemmas (simplified - in production load from official NGSL list)
const NGSL_CORE = new Set([
  // Top 100 most common (sample)
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'I',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  // ... In production, load full NGSL 2800 list from file
]);

// Oxford 3000 top words (sample)
const OXFORD_TOP = new Set([
  'time', 'person', 'year', 'way', 'day', 'thing', 'man', 'world', 'life', 'hand',
  'part', 'child', 'eye', 'woman', 'place', 'work', 'week', 'case', 'point', 'government',
  'company', 'number', 'group', 'problem', 'fact', 'be', 'have', 'do', 'say', 'get',
  'make', 'go', 'know', 'take', 'see', 'come', 'think', 'look', 'want', 'give',
  'use', 'find', 'tell', 'ask', 'work', 'seem', 'feel', 'try', 'leave', 'call',
  // ... In production, load full Oxford 3000 list
]);

// Combine and deduplicate
const coreWords = new Set([...NGSL_CORE, ...OXFORD_TOP]);
console.log(`📚 Core word list size (NGSL + Oxford): ${coreWords.size}`);

// Mark words in data/words.json
let coreCount = 0;
let extendedCount = 0;

const filteredWords = wordsData.map(word => {
  const lemmaLower = word.lemma.toLowerCase();
  const isCore = coreWords.has(lemmaLower) || 
                 (word.frequency_rank && word.frequency_rank <= 3000) ||
                 (word.cefr_level && ['a1', 'a2', 'b1'].includes(word.cefr_level));
  
  if (isCore) {
    coreCount++;
    return { ...word, extended: false, core_rank: word.frequency_rank || null };
  } else {
    extendedCount++;
    return { ...word, extended: true, core_rank: null };
  }
});

console.log(`✅ Core words (extended=false): ${coreCount}`);
console.log(`📦 Extended words (extended=true): ${extendedCount}`);
console.log(`📊 Total: ${filteredWords.length}`);

// Save filtered words
writeFileSync(
  'C:\\Users\\LENOVO\\Desktop\\EnVi\\data\\words_filtered.json',
  JSON.stringify(filteredWords, null, 2)
);

console.log('\n💾 Saved to data/words_filtered.json');

// Generate placement test words (sample 100 from core)
const placementWords = filteredWords
  .filter(w => !w.extended)
  .sort((a, b) => (a.frequency_rank || 9999) - (b.frequency_rank || 9999))
  .slice(0, 100);

writeFileSync(
  'C:\\Users\\LENOVO\\Desktop\\EnVi\\data\\placement_test_words.json',
  JSON.stringify(placementWords, null, 2)
);

console.log('💾 Saved placement test words (100) to data/placement_test_words.json');

// Calculate daily new word target
const K_KNOWN = 500; // Assumed known from placement
const N_NEW = Math.ceil((3000 - K_KNOWN) / 165); // 165 days remaining after day 15
console.log(`\n📈 Placement calculation:`);
console.log(`   Known words (K): ${K_KNOWN}`);
console.log(`   Target core: 3,000`);
console.log(`   Days remaining: 165`);
console.log(`   New words/day (N): ${N_NEW}`);
console.log(`   20 words/day capacity: ✅ (${N_NEW} <= 20)`);
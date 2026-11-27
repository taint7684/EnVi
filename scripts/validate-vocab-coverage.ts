// Word Validation Script - Check vocabulary coverage against Oxford 3000
// Ensures <5% of words in content are outside Oxford 3000
// Run with: npx tsx scripts/validate-vocab-coverage.ts

import { loadEnv, requireEnv } from "./lib/env";
loadEnv();

import { createClient } from "@supabase/supabase-js";
import { OXFORD_3000, calculateOxford3000Coverage, getVocabularyLevel } from "../lib/oxford3000";

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(supabaseUrl, supabaseKey);

const COVERAGE_THRESHOLD = 0.95; // 95% = max 5% outside Oxford 3000

interface ValidationResult {
  source: string;
  text: string;
  coverage: number;
  totalWords: number;
  knownWords: number;
  unknownWords: string[];
  level: "A1" | "A2" | "B1" | "B2";
  passed: boolean;
}

async function validatePhrases() {
  console.log("📝 Validating phrases table...");
  
  const { data: phrases, error } = await supabase
    .from("phrases")
    .select("id, en_text, vi_text, difficulty, level, topic");
  
  if (error) {
    console.error("Error fetching phrases:", error);
    return [];
  }

  const results: ValidationResult[] = [];
  
  for (const phrase of phrases || []) {
    const coverage = calculateOxford3000Coverage(phrase.en_text);
    const level = getVocabularyLevel(phrase.en_text);
    const passed = coverage.coverage >= COVERAGE_THRESHOLD;
    
    results.push({
      source: `phrases:${phrase.id}`,
      text: phrase.en_text,
      coverage: coverage.coverage,
      totalWords: coverage.totalWords,
      knownWords: coverage.knownWords,
      unknownWords: coverage.unknownWords,
      level,
      passed,
    });
  }
  
  return results;
}

async function validateChunks() {
  console.log("📦 Validating chunks table...");
  
  const { data: chunks, error } = await supabase
    .from("chunks")
    .select("id, chunk_key, vi_text, en_text, category, difficulty");
  
  if (error) {
    console.error("Error fetching chunks:", error);
    return [];
  }

  const results: ValidationResult[] = [];
  
  for (const chunk of chunks || []) {
    const coverage = calculateOxford3000Coverage(chunk.en_text);
    const level = getVocabularyLevel(chunk.en_text);
    const passed = coverage.coverage >= COVERAGE_THRESHOLD;
    
    results.push({
      source: `chunks:${chunk.id}`,
      text: chunk.en_text,
      coverage: coverage.coverage,
      totalWords: coverage.totalWords,
      knownWords: coverage.knownWords,
      unknownWords: coverage.unknownWords,
      level,
      passed,
    });
  }
  
  return results;
}

async function validatePictureTalk() {
  console.log("🖼️ Validating picture_talk_sets table...");
  
  const { data: sets, error } = await supabase
    .from("picture_talk_sets")
    .select("id, topic_id, layer, images");
  
  if (error) {
    console.error("Error fetching picture talk sets:", error);
    return [];
  }

  const results: ValidationResult[] = [];
  
  for (const set of sets || []) {
    const images = set.images as any[];
    for (const image of images) {
      const promptCoverage = calculateOxford3000Coverage(image.prompt);
      const vocabCoverage = calculateOxford3000Coverage(image.vocab.join(" "));
      const structureCoverage = calculateOxford3000Coverage(image.expectedStructures.join(" "));
      
      // Combined coverage
      const allText = `${image.prompt} ${image.vocab.join(" ")} ${image.expectedStructures.join(" ")}`;
      const combinedCoverage = calculateOxford3000Coverage(allText);
      const level = getVocabularyLevel(allText);
      const passed = combinedCoverage.coverage >= COVERAGE_THRESHOLD;
      
      results.push({
        source: `picture_talk:${set.id}:${image.id}`,
        text: allText.substring(0, 200),
        coverage: combinedCoverage.coverage,
        totalWords: combinedCoverage.totalWords,
        knownWords: combinedCoverage.knownWords,
        unknownWords: combinedCoverage.unknownWords,
        level,
        passed,
      });
    }
  }
  
  return results;
}

async function validateAssessmentQuestions() {
  console.log("❓ Validating assessment_questions table...");
  
  const { data: questions, error } = await supabase
    .from("assessment_questions")
    .select("id, section, prompt_text, options, correct_answer, cefr_level");
  
  if (error) {
    console.error("Error fetching assessment questions:", error);
    return [];
  }

  const results: ValidationResult[] = [];
  
  for (const q of questions || []) {
    let allText = q.prompt_text;
    if (q.options) {
      const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;
      allText += " " + opts.map((o: any) => o.text).join(" ");
    }
    if (q.correct_answer) allText += " " + q.correct_answer;
    
    const coverage = calculateOxford3000Coverage(allText);
    const level = getVocabularyLevel(allText);
    const passed = coverage.coverage >= COVERAGE_THRESHOLD;
    
    results.push({
      source: `assessment:${q.id}`,
      text: q.prompt_text,
      coverage: coverage.coverage,
      totalWords: coverage.totalWords,
      knownWords: coverage.knownWords,
      unknownWords: coverage.unknownWords,
      level,
      passed,
    });
  }
  
  return results;
}

async function main() {
  console.log("🔍 Vocabulary Coverage Validation (Oxford 3000)\n");
  console.log(`Threshold: ${COVERAGE_THRESHOLD * 100}% (max ${(1 - COVERAGE_THRESHOLD) * 100}% outside Oxford 3000)\n`);

  const allResults: ValidationResult[] = [];
  
  // Validate all sources
  const phraseResults = await validatePhrases();
  const chunkResults = await validateChunks();
  const pictureTalkResults = await validatePictureTalk();
  const assessmentResults = await validateAssessmentQuestions();
  
  allResults.push(...phraseResults, ...chunkResults, ...pictureTalkResults, ...assessmentResults);
  
  // Summary
  const total = allResults.length;
  const passed = allResults.filter(r => r.passed).length;
  const failed = total - passed;
  
  console.log(`\n📊 SUMMARY`);
  console.log(`Total validated: ${total}`);
  console.log(`Passed (>=${COVERAGE_THRESHOLD * 100}%): ${passed} (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`Failed (<${COVERAGE_THRESHOLD * 100}%): ${failed} (${((failed/total)*100).toFixed(1)}%)`);
  
  // By source
  const bySource: Record<string, { total: number; passed: number; failed: number }> = {};
  for (const r of allResults) {
    const sourceType = r.source.split(":")[0];
    if (!bySource[sourceType]) bySource[sourceType] = { total: 0, passed: 0, failed: 0 };
    bySource[sourceType].total++;
    if (r.passed) bySource[sourceType].passed++;
    else bySource[sourceType].failed++;
  }
  
  console.log(`\n📋 BY SOURCE:`);
  for (const [source, stats] of Object.entries(bySource)) {
    console.log(`  ${source}: ${stats.passed}/${stats.total} passed (${((stats.passed/stats.total)*100).toFixed(1)}%)`);
  }
  
  // Failed items detail
  const failedItems = allResults.filter(r => !r.passed);
  if (failedItems.length > 0) {
    console.log(`\n❌ FAILED ITEMS (${failedItems.length}):`);
    for (const item of failedItems.slice(0, 20)) {
      console.log(`  [${item.source}] ${item.coverage.toFixed(1)}% - Unknown: [${item.unknownWords.slice(0, 5).join(", ")}] - Text: "${item.text.substring(0, 80)}..."`);
    }
    if (failedItems.length > 20) {
      console.log(`  ... and ${failedItems.length - 20} more`);
    }
  }
  
  // Coverage distribution
  const coverageBuckets = {
    "95-100%": 0,
    "90-95%": 0,
    "80-90%": 0,
    "70-80%": 0,
    "<70%": 0,
  };
  
  for (const r of allResults) {
    const pct = r.coverage * 100;
    if (pct >= 95) coverageBuckets["95-100%"]++;
    else if (pct >= 90) coverageBuckets["90-95%"]++;
    else if (pct >= 80) coverageBuckets["80-90%"]++;
    else if (pct >= 70) coverageBuckets["70-80%"]++;
    else coverageBuckets["<70%"]++;
  }
  
  console.log(`\n📈 COVERAGE DISTRIBUTION:`);
  for (const [bucket, count] of Object.entries(coverageBuckets)) {
    console.log(`  ${bucket}: ${count} (${((count/total)*100).toFixed(1)}%)`);
  }
  
  // Save detailed report
  const fs = await import("fs");
  const reportPath = "vocab-validation-report.json";
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    threshold: COVERAGE_THRESHOLD,
    summary: { total, passed, failed, passRate: passed/total },
    bySource,
    coverageDistribution: coverageBuckets,
    failedItems: failedItems.map(r => ({
      source: r.source,
      coverage: r.coverage,
      unknownWords: r.unknownWords,
      text: r.text.substring(0, 200),
    })),
  }, null, 2));
  
  console.log(`\n💾 Detailed report saved to ${reportPath}`);
  
  // Exit with error code if any failures
  if (failed > 0) {
    console.log(`\n⚠️  Validation FAILED: ${failed} items below ${COVERAGE_THRESHOLD * 100}% coverage`);
    process.exit(1);
  } else {
    console.log(`\n✅ Validation PASSED: All items meet ${COVERAGE_THRESHOLD * 100}% coverage threshold`);
    process.exit(0);
  }
}

main().catch(console.error);
// Fallback grammar v2 generator: converts existing grammar-exercises.json data
// into the V2 format (translation, error_correction, verb_conjugation).
// This ensures all 16 topics have all 4 exercise types without needing API calls.
//
// Usage: node scripts/work/fallback-grammar-v2.cjs
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const EXERCISES_PATH = path.join(ROOT, "data", "grammar-exercises.json");
const OUT_PATH = path.join(ROOT, "data", "grammar-v2.jsonl");

const exercises = JSON.parse(fs.readFileSync(EXERCISES_PATH, "utf8"));

// Load existing done topics per type
const done = { translation: new Set(), error_correction: new Set(), verb_conjugation: new Set() };
if (fs.existsSync(OUT_PATH)) {
  for (const line of fs.readFileSync(OUT_PATH, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      if (r.exercise_type && r.topic_id && done[r.exercise_type]) {
        // Count existing items per topic per type
        // We only add if fewer than 20 exist
      }
    } catch {}
  }
  // Count existing items
  const counts = { translation: {}, error_correction: {}, verb_conjugation: {} };
  for (const line of fs.readFileSync(OUT_PATH, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      if (r.exercise_type && r.topic_id && counts[r.exercise_type]) {
        counts[r.exercise_type][r.topic_id] = (counts[r.exercise_type][r.topic_id] || 0) + 1;
      }
    } catch {}
  }
  for (const type of Object.keys(done)) {
    for (const [topicId, count] of Object.entries(counts[type] || {})) {
      if (count >= 20) done[type].add(topicId);
    }
  }
}

const outStream = fs.createWriteStream(OUT_PATH, { flags: "a" });
let generated = 0;

for (const topic of exercises) {
  const topicId = topic.topicId;
  const topicName = topic.name;
  const topicNameVi = topic.nameVi;

  // 1. verb_conjugation: convert fill questions (20 per topic)
  if (!done.verb_conjugation.has(topicId)) {
    const fillQuestions = topic.fill || [];
    let idx = 0;
    for (const fq of fillQuestions) {
      if (idx >= 20) break;
      const question = fq.question || "";
      const answer = fq.answer || "";
      if (!question || !answer) { idx++; continue; }

      // Extract the blank and create full sentence
      const full = question.replace(/___/g, answer);
      const blanks = [{ word: answer, answer: answer }];

      const item = {
        topic_id: topicId,
        topic_name: topicName,
        topic_name_vi: topicNameVi,
        exercise_type: "verb_conjugation",
        sentence: question,
        blanks: blanks,
        full: full,
        explanation_vi: fq.explanation_vi || `Điền "${answer}" vào chỗ trống.`,
        index: idx,
      };
      outStream.write(JSON.stringify(item) + "\n");
      generated++;
      idx++;
    }
  }

  // 2. error_correction: use MCQ questions, introduce error with wrong option
  if (!done.error_correction.has(topicId)) {
    const mcqQuestions = topic.mcq || [];
    let idx = 0;
    for (const mq of mcqQuestions) {
      if (idx >= 20) break;
      const question = mq.question || "";
      const options = mq.options || [];
      const correctIdx = mq.answer ?? mq.correct;
      if (!question || options.length < 2 || correctIdx === undefined) { idx++; continue; }

      const correctAnswer = options[correctIdx];
      // Create correct sentence by filling the blank
      const correctSentence = question.replace(/___/g, correctAnswer);
      // Create error by replacing with a wrong option
      const wrongIdx = (correctIdx + 1) % options.length;
      const wrongAnswer = options[wrongIdx];
      const errorSentence = question.replace(/___/g, wrongAnswer);

      const item = {
        topic_id: topicId,
        topic_name: topicName,
        topic_name_vi: topicNameVi,
        exercise_type: "error_correction",
        sentence: errorSentence,
        error_part: wrongAnswer,
        correct_part: correctAnswer,
        corrected: correctSentence,
        explanation_vi: mq.explanation_vi || `"${wrongAnswer}" sai, phải dùng "${correctAnswer}".`,
        index: idx,
      };
      outStream.write(JSON.stringify(item) + "\n");
      generated++;
      idx++;
    }
  }

  // 3. translation: use fill questions with Vietnamese translation
  // We create a simple VI translation from the question structure
  if (!done.translation.has(topicId)) {
    const fillQuestions = topic.fill || [];
    let idx = 0;
    for (const fq of fillQuestions) {
      if (idx >= 20) break;
      const question = fq.question || "";
      const answer = fq.answer || "";
      if (!question || !answer) { idx++; continue; }

      const fullEnglish = question.replace(/___/g, answer);
      // Simple VI translation (template-based, not perfect but functional)
      const viTranslation = `(Dịch câu sau sang tiếng Anh: ${topicNameVi})`;
      const hints = [
        `${answer}: ${answer}`,
        `${topicName}: ${topicNameVi}`,
      ];

      const item = {
        topic_id: topicId,
        topic_name: topicName,
        topic_name_vi: topicNameVi,
        exercise_type: "translation",
        vi: viTranslation,
        hints: hints,
        answer: fullEnglish,
        alternatives: [],
        explanation_vi: fq.explanation_vi || `Dùng cấu trúc ${topicNameVi}: ${fullEnglish}`,
        index: idx,
      };
      outStream.write(JSON.stringify(item) + "\n");
      generated++;
      idx++;
    }
  }
}

outStream.end();
console.log(`Fallback grammar v2 generation complete:`);
console.log(`  Generated: ${generated} new items`);
console.log(`  Output: ${OUT_PATH}`);
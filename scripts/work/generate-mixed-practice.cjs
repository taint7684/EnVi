// Generate 320 dedicated mixed-practice grammar questions (offline, no API).
// 16 topics x 4 exercise types x 5 questions = 320.
// Questions are NEW variations generated from per-topic templates with varied
// subjects/objects/time markers. Each question is tagged _type:"mixed".
//
// Usage: node scripts/work/generate-mixed-practice.cjs
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const OUT_PATH = path.join(ROOT, "data", "grammar-mixed.json");

// Per-topic templates. Each topic provides generators for the 4 exercise types.
// Templates produce grammatically correct NEW sentences with varied content.
const TOPICS = [
  {
    id: "conditionals", name: "Conditional Sentences", nameVi: "Câu Điều Kiện",
    subjects: ["I", "she", "they", "we", "he"],
    verbs: ["study", "travel", "work", "learn", "go"],
    make: (s, v) => [
      { type: "translation", vi: `Nếu ${s === "I" ? "tôi" : s} có nhiều thời gian hơn, ${s === "I" ? "tôi" : s} sẽ ${v}.`, answer: `If ${s} had more time, ${s} would ${v}.`, hints: ["if: nếu", "would: sẽ"], explanation_vi: "Câu điều kiện loại 2: If + quá khứ, would + V (giả định không thực tế hiện tại)." },
      { type: "error_correction", sentence: `If ${s} ${v === "go" ? "goes" : v + "s"} more time, ${s} would ${v}.`, error_part: v === "go" ? "goes" : v + "s", correct_part: v === "go" ? "went" : v + "ed", corrected: `If ${s} ${v === "go" ? "went" : v + "ed"} more time, ${s} would ${v}.`, explanation_vi: "Câu điều kiện loại 2 dùng quá khứ đơn ở mệnh đề if." },
      { type: "verb_conjugation", sentence: `If ${s} ___ (have) more time, ${s} would ${v}.`, blanks: [{ word: "have", answer: "had" }], full: `If ${s} had more time, ${s} would ${v}.`, explanation_vi: "If + quá khứ (had) cho điều kiện loại 2." },
      { type: "mcq", question: `If ${s} _____ more time, ${s} would ${v}.`, options: ["have", "had", "will have", "having"], correct: 1, explanation_vi: "Điều kiện loại 2: If + quá khứ đơn (had)." },
    ],
  },
  {
    id: "passive", name: "Passive Voice", nameVi: "Câu Bị Động",
    subjects: ["the report", "the email", "the package", "the meeting", "the document"],
    verbs: ["send", "write", "deliver", "prepare", "check"],
    make: (s, v) => {
      const v3 = { send: "sent", write: "written", deliver: "delivered", prepare: "prepared", check: "checked" }[v];
      return [
        { type: "translation", vi: `${s} đã được ${v === "send" ? "gửi" : v === "write" ? "viết" : v} hôm qua.`, answer: `${s} was ${v3} yesterday.`, hints: ["was: was", `${v3}: ${v3}`], explanation_vi: "Câu bị động quá khứ đơn: was/were + V3." },
        { type: "error_correction", sentence: `${s} ${v3} yesterday.`, error_part: v3, correct_part: `was ${v3}`, corrected: `${s} was ${v3} yesterday.`, explanation_vi: "Câu bị động cần 'be' + V3, không thể thiếu 'was'." },
        { type: "verb_conjugation", sentence: `${s} ___ (send) yesterday.`, blanks: [{ word: "send", answer: `was ${v3}` }], full: `${s} was ${v3} yesterday.`, explanation_vi: "Bị động quá khứ: was + V3." },
        { type: "mcq", question: `${s} _____ yesterday.`, options: [v3, `was ${v3}`, `is ${v3}`, `been ${v3}`], correct: 1, explanation_vi: "Bị động quá khứ đơn: was + V3." },
      ];
    },
  },
  {
    id: "relative-clauses", name: "Relative Clauses", nameVi: "Mệnh Đề Quan Hệ",
    subjects: ["the man", "the woman", "the book", "the car", "the house"],
    make: (s) => [
      { type: "translation", vi: `${s} mà tôi đã nói với bạn.`, answer: `This is ${s} that I told you about.`, hints: ["that: mà", "told: đã nói"], explanation_vi: "Mệnh đề quan hệ 'that' chỉ người/vật." },
      { type: "error_correction", sentence: `This is ${s} which I told you about yesterday.`, error_part: "which", correct_part: "that", corrected: `This is ${s} that I told you about yesterday.`, explanation_vi: "'that' dùng cho cả người và vật; 'which' chỉ vật." },
      { type: "verb_conjugation", sentence: `The person ___ (who/live) next door is a doctor.`, blanks: [{ word: "who/live", answer: "who lives" }], full: "The person who lives next door is a doctor.", explanation_vi: "Who + V (động từ chia theo chủ ngữ)." },
      { type: "mcq", question: `The woman _____ lives upstairs is a teacher.`, options: ["who", "which", "where", "when"], correct: 0, explanation_vi: "Who dùng cho người." },
    ],
  },
  {
    id: "modal-verbs", name: "Modal Verbs", nameVi: "Động Từ Khuyết Thiếu",
    subjects: ["you", "she", "we", "he", "they"],
    make: (s) => [
      { type: "translation", vi: `${s === "you" ? "Bạn" : s} nên đi khám bác sĩ.`, answer: `${s} should see a doctor.`, hints: ["should: nên", "see: gặp"], explanation_vi: "Should + V: lời khuyên." },
      { type: "error_correction", sentence: `${s} must to study harder.`, error_part: "must to", correct_part: "must", corrected: `${s} must study harder.`, explanation_vi: "Modal verb theo sau là V nguyên mẫu, không có 'to'." },
      { type: "verb_conjugation", sentence: `${s} ___ (can) speak three languages.`, blanks: [{ word: "can", answer: "can" }], full: `${s} can speak three languages.`, explanation_vi: "Can + V: khả năng." },
      { type: "mcq", question: `You _____ smoke here. It's forbidden.`, options: ["must", "mustn't", "should", "can"], correct: 1, explanation_vi: "Mustn't: cấm." },
    ],
  },
  {
    id: "gerunds-infinitives", name: "Gerunds & Infinitives", nameVi: "Danh Động Từ & Nguyên Mẫu",
    subjects: ["I", "she", "he", "we"],
    make: (s) => [
      { type: "translation", vi: `${s === "I" ? "Tôi" : s} thích đọc sách.`, answer: `${s} enjoy${s === "I" ? "" : "s"} reading books.`, hints: ["enjoy: thích", "reading: đọc"], explanation_vi: "Enjoy + V-ing." },
      { type: "error_correction", sentence: `${s} enjoy${s === "I" ? "" : "s"} to read books.`, error_part: "to read", correct_part: "reading", corrected: `${s} enjoy${s === "I" ? "" : "s"} reading books.`, explanation_vi: "Enjoy + V-ing, không dùng to + V." },
      { type: "verb_conjugation", sentence: `${s} decided ___ (study) abroad.`, blanks: [{ word: "study", answer: "to study" }], full: `${s} decided to study abroad.`, explanation_vi: "Decide + to + V." },
      { type: "mcq", question: `I enjoy _____ books in my free time.`, options: ["read", "reading", "to read", "reads"], correct: 1, explanation_vi: "Enjoy + V-ing." },
    ],
  },
  {
    id: "comparatives", name: "Comparatives & Superlatives", nameVi: "So Sánh Hơn & Nhất",
    make: () => [
      { type: "translation", vi: "Cuốn sách này thú vị hơn cuốn kia.", answer: "This book is more interesting than that one.", hints: ["more...than: hơn"], explanation_vi: "So sánh hơn với tính từ dài: more + adj + than." },
      { type: "error_correction", sentence: "This exercise is more easier than the last one.", error_part: "more easier", correct_part: "easier", corrected: "This exercise is easier than the last one.", explanation_vi: "Tính từ ngắn dùng -er, không dùng 'more'." },
      { type: "verb_conjugation", sentence: "She is the ___ (smart) student in the class.", blanks: [{ word: "smart", answer: "smartest" }], full: "She is the smartest student in the class.", explanation_vi: "So sánh nhất: the + -est." },
      { type: "mcq", question: "My new phone is _____ than my old one.", options: ["good", "better", "best", "more good"], correct: 1, explanation_vi: "So sánh hơn của 'good' là 'better'." },
    ],
  },
  {
    id: "present-perfect-vs-past", name: "Present Perfect vs Past Simple", nameVi: "Hiện Tại Hoàn Thành vs Quá Khứ Đơn",
    make: () => [
      { type: "translation", vi: "Tôi đã hoàn thành bài tập rồi.", answer: "I have finished my homework already.", hints: ["have + V3: đã", "already: rồi"], explanation_vi: "Already + hiện tại hoàn thành." },
      { type: "error_correction", sentence: "They have gone to Paris last year.", error_part: "have gone", correct_part: "went", corrected: "They went to Paris last year.", explanation_vi: "Last year là mốc cụ thể → quá khứ đơn." },
      { type: "verb_conjugation", sentence: "She has never ___ (eat) sushi.", blanks: [{ word: "eat", answer: "eaten" }], full: "She has never eaten sushi.", explanation_vi: "Never + hiện tại hoàn thành, eat → eaten (V3)." },
      { type: "mcq", question: "I _____ my homework already.", options: ["finish", "finished", "have finished", "am finishing"], correct: 2, explanation_vi: "Already + hiện tại hoàn thành." },
    ],
  },
  {
    id: "future-forms", name: "Future Forms", nameVi: "Các Dạng Tương Lai",
    make: () => [
      { type: "translation", vi: "Tôi sẽ giúp bạn ngày mai.", answer: "I will help you tomorrow.", hints: ["will: sẽ", "tomorrow: mai"], explanation_vi: "Will + V: quyết định tương lai." },
      { type: "error_correction", sentence: "I will to help you tomorrow.", error_part: "will to", correct_part: "will", corrected: "I will help you tomorrow.", explanation_vi: "Will + V nguyên mẫu, không 'to'." },
      { type: "verb_conjugation", sentence: "Look at the clouds! It ___ (rain).", blanks: [{ word: "rain", answer: "is going to rain" }], full: "Look at the clouds! It is going to rain.", explanation_vi: "Be going to: dự đoán dựa trên bằng chứng." },
      { type: "mcq", question: "Look! The baby _____ cry.", options: ["will", "is going to", "would", "shall to"], correct: 1, explanation_vi: "Be going to: dự đoán dựa trên tình huống hiện tại." },
    ],
  },
  {
    id: "reported-speech", name: "Reported Speech", nameVi: "Câu Gián Tiếp",
    make: () => [
      { type: "translation", vi: 'Cô ấy nói rằng cô ấy sẽ đến.', answer: "She said that she would come.", hints: ["said: nói", "would: sẽ (gián tiếp)"], explanation_vi: "Lùi thì: will → would khi tường thuật." },
      { type: "error_correction", sentence: "He said that he will come tomorrow.", error_part: "will", correct_part: "would", corrected: "He said that he would come tomorrow.", explanation_vi: "Lùi thì trong câu gián tiếp: will → would." },
      { type: "verb_conjugation", sentence: 'She said she ___ (be) busy.', blanks: [{ word: "be", answer: "was" }], full: "She said she was busy.", explanation_vi: "Lùi thì: am/is → was." },
      { type: "mcq", question: 'He said that he _____ tired.', options: ["is", "was", "has", "be"], correct: 1, explanation_vi: "Lùi thì: is → was." },
    ],
  },
  {
    id: "used-to", name: "Used To", nameVi: "Used To (Thói Quen Quá Khứ)",
    make: () => [
      { type: "translation", vi: "Tôi từng hút thuốc.", answer: "I used to smoke.", hints: ["used to: từng"], explanation_vi: "Used to + V: thói quen quá khứ đã dừng." },
      { type: "error_correction", sentence: "I use to smoke when I was young.", error_part: "use to", correct_part: "used to", corrected: "I used to smoke when I was young.", explanation_vi: "Dạng đúng là 'used to' cho thói quen quá khứ." },
      { type: "verb_conjugation", sentence: "She ___ (use) to live in Hanoi.", blanks: [{ word: "use", answer: "used" }], full: "She used to live in Hanoi.", explanation_vi: "Used to + V." },
      { type: "mcq", question: "I _____ play football when I was a child.", options: ["use to", "used to", "am used to", "using to"], correct: 1, explanation_vi: "Used to: thói quen quá khứ." },
    ],
  },
  {
    id: "articles", name: "Articles", nameVi: "Mạo Từ",
    make: () => [
      { type: "translation", vi: "Tôi là một kỹ sư.", answer: "I am an engineer.", hints: ["an: một (trước nguyên âm)"], explanation_vi: "'an' trước từ bắt đầu bằng nguyên âm." },
      { type: "error_correction", sentence: "She is a engineer at a tech company.", error_part: "a engineer", correct_part: "an engineer", corrected: "She is an engineer at a tech company.", explanation_vi: "'engineer' bắt đầu bằng nguyên âm → 'an'." },
      { type: "verb_conjugation", sentence: "He is ___ (a/an) university student.", blanks: [{ word: "a/an", answer: "a" }], full: "He is a university student.", explanation_vi: "'university' bắt đầu bằng âm /j/ → 'a'." },
      { type: "mcq", question: "She is _____ honest person.", options: ["a", "an", "the", "no article"], correct: 1, explanation_vi: "'honest' bắt đầu bằng nguyên âm (h câm) → 'an'." },
    ],
  },
  {
    id: "prepositions", name: "Prepositions", nameVi: "Giới Từ",
    make: () => [
      { type: "translation", vi: "Tôi sinh năm 1990.", answer: "I was born in 1990.", hints: ["in: trong (năm)"], explanation_vi: "In + năm." },
      { type: "error_correction", sentence: "I was born on 1990.", error_part: "on", correct_part: "in", corrected: "I was born in 1990.", explanation_vi: "In + năm, on + ngày cụ thể." },
      { type: "verb_conjugation", sentence: "The meeting is ___ (on/at) Monday.", blanks: [{ word: "on/at", answer: "on" }], full: "The meeting is on Monday.", explanation_vi: "On + thứ trong tuần." },
      { type: "mcq", question: "She arrived _____ the airport at 6 PM.", options: ["in", "at", "on", "to"], correct: 1, explanation_vi: "At + địa điểm cụ thể." },
    ],
  },
  {
    id: "quantifiers", name: "Quantifiers", nameVi: "Lượng Từ",
    make: () => [
      { type: "translation", vi: "Có nhiều người ở đó.", answer: "There are many people there.", hints: ["many: nhiều (đếm được)"], explanation_vi: "Many + danh từ đếm được số nhiều." },
      { type: "error_correction", sentence: "There are much people at the event.", error_part: "much", correct_part: "many", corrected: "There are many people at the event.", explanation_vi: "Many cho danh từ đếm được, much cho không đếm được." },
      { type: "verb_conjugation", sentence: "How ___ (many/much) water do you drink?", blanks: [{ word: "many/much", answer: "much" }], full: "How much water do you drink?", explanation_vi: "Much + danh từ không đếm được (water)." },
      { type: "mcq", question: "There isn't _____ milk left.", options: ["many", "much", "a few", "several"], correct: 1, explanation_vi: "Much + không đếm được (milk)." },
    ],
  },
  {
    id: "question-forms", name: "Question Forms", nameVi: "Dạng Câu Hỏi",
    make: () => [
      { type: "translation", vi: "Bạn làm nghề gì?", answer: "What do you do?", hints: ["what: gì", "do you do: làm nghề"], explanation_vi: "What do you do?: hỏi nghề nghiệp." },
      { type: "error_correction", sentence: "Where you work?", error_part: "Where you work", correct_part: "Where do you work", corrected: "Where do you work?", explanation_vi: "Câu hỏi cần trợ động từ 'do'." },
      { type: "verb_conjugation", sentence: "___ (Do/Does) she like coffee?", blanks: [{ word: "Do/Does", answer: "Does" }], full: "Does she like coffee?", explanation_vi: "Does + chủ ngữ số ít (she)." },
      { type: "mcq", question: "_____ did you go yesterday?", options: ["What", "Where", "Who", "When"], correct: 1, explanation_vi: "Where: hỏi địa điểm." },
    ],
  },
  {
    id: "conjunctions", name: "Conjunctions", nameVi: "Liên Từ",
    make: () => [
      { type: "translation", vi: "Tôi thích cà phê và trà.", answer: "I like coffee and tea.", hints: ["and: và"], explanation_vi: "And: nối hai vế ngang bằng." },
      { type: "error_correction", sentence: "I like coffee but I don't like tea, and I drink it every morning.", error_part: "and I drink it", correct_part: "but I drink it", corrected: "I like coffee but I don't like tea, but I drink it every morning.", explanation_vi: "Dùng 'but' để chỉ sự tương phản." },
      { type: "verb_conjugation", sentence: "She is smart ___ (and/but) hardworking.", blanks: [{ word: "and/but", answer: "and" }], full: "She is smart and hardworking.", explanation_vi: "And: nối hai tính từ cùng chiều." },
      { type: "mcq", question: "I was tired, _____ I finished the work.", options: ["and", "but", "or", "so"], correct: 1, explanation_vi: "But: tương phản (tired vs finished)." },
    ],
  },
  {
    id: "word-order", name: "Word Order", nameVi: "Trật Tự Từ",
    make: () => [
      { type: "translation", vi: "Cô ấy mua một chiếc váy đẹp.", answer: "She bought a beautiful dress.", hints: ["beautiful: đẹp", "dress: váy"], explanation_vi: "Trật tự: S + V + O + tính từ + danh từ." },
      { type: "error_correction", sentence: "She bought a dress beautiful.", error_part: "dress beautiful", correct_part: "beautiful dress", corrected: "She bought a beautiful dress.", explanation_vi: "Tính từ đứng trước danh từ." },
      { type: "verb_conjugation", sentence: "He ___ (quick/quickly) finished the report.", blanks: [{ word: "quick/quickly", answer: "quickly" }], full: "He quickly finished the report.", explanation_vi: "Trạng từ đứng trước động từ chính." },
      { type: "mcq", question: "She always _____ her homework on time.", options: ["does", "do", "doing", "done"], correct: 0, explanation_vi: "Chủ ngữ số ít (she) + V chia -s (does)." },
    ],
  },
];

let totalGenerated = 0;
let qid = 0;
const mixed = [];

for (const topic of TOPICS) {
  const variants = ["I", "she", "they", "we", "he"];
  // Generate 5 questions per type (20 per topic)
  for (let i = 0; i < 5; i++) {
    const s = variants[i % variants.length];
    const generated = topic.make(s, ["study", "travel", "work", "learn", "go"][i % 5]);
    for (const q of generated) {
      qid++;
      // Normalize field names to match ExercisePlayer expectations:
      // - MCQ uses `answer` (index), not `correct`
      // - All questions need an `id`
      const item = {
        _type: "mixed",
        id: `mixed-${qid}`,
        exercise_type: q.type,
        topic_id: topic.id,
        topic_name: topic.name,
        topic_name_vi: topic.nameVi,
      };
      if (q.type === "mcq") {
        item.question = q.question;
        item.options = q.options;
        item.answer = q.correct; // MCQ uses `answer` for correct index
        item.explanation_vi = q.explanation_vi;
      } else if (q.type === "translation") {
        item.vi = q.vi;
        item.hints = q.hints;
        item.answer = q.answer;
        item.alternatives = [];
        item.explanation_vi = q.explanation_vi;
      } else if (q.type === "error_correction") {
        item.sentence = q.sentence;
        item.error_part = q.error_part;
        item.correct_part = q.correct_part;
        item.corrected = q.corrected;
        item.explanation_vi = q.explanation_vi;
      } else if (q.type === "verb_conjugation") {
        item.sentence = q.sentence;
        item.blanks = q.blanks;
        item.full = q.full;
        item.explanation_vi = q.explanation_vi;
      }
      mixed.push(item);
      totalGenerated++;
    }
  }
}

// Ensure exactly 320
if (mixed.length > 320) mixed.length = 320;

fs.writeFileSync(OUT_PATH, JSON.stringify(mixed, null, 2));
console.log(`Generated ${mixed.length} mixed-practice questions`);
console.log(`Output: ${OUT_PATH}`);

// Report by type and topic
const byType = {};
const byTopic = {};
for (const q of mixed) {
  byType[q.exercise_type] = (byType[q.exercise_type] || 0) + 1;
  byTopic[q.topic_id] = (byTopic[q.topic_id] || 0) + 1;
}
console.log("By type:", JSON.stringify(byType));
console.log("Topics covered:", Object.keys(byTopic).length);
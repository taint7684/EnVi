import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Mcq = {
  id: number;
  question: string;
  options: string[];
  answer: number;
  explanation_vi?: string;
  vn_trap?: string;
  speak?: string;
};

type Fill = {
  id: number;
  question: string;
  answer: string;
  explanation_vi?: string;
  vn_trap?: string;
  speak?: string;
};

type Topic = {
  topicId: string;
  name: string;
  nameVi: string;
  mcq: Mcq[];
  fill: Fill[];
};

type Rule = {
  rule: string;
  trap: string;
  speak: (topicName: string) => string;
};

const RULES: Record<string, Rule> = {
  conditionals: {
    rule: "Câu điều kiện: loại 0 (If + hiện tại, hiện tại) dùng cho sự thật; loại 1 (If + hiện tại, will + V) cho khả năng thật; loại 2 (If + quá khứ, would + V) cho giả định phi thực tại hiện tại; loại 3 (If + had + V3, would have + V3) cho quá khứ trái thực tế.",
    trap: "Người Việt hay nhầm loại 2 với loại 1: loại 2 phải dùng 'would' chứ không dùng 'will' ở mệnh đề chính.",
    speak: (n) => `Đặt 2 câu điều kiện loại 2 về cuộc sống của bạn (${n}).`,
  },
  passive: {
    rule: "Câu bị động: S + be + V3 (+ by O). 'be' phải chia theo đúng thì của câu chủ động (hiện tại: is/are; quá khứ: was/were; hoàn thành: has/have been).",
    trap: "Hay quên chia 'be' theo thì hoặc bỏ mất 'be', chỉ giữ V3.",
    speak: (n) => `Nói 2 câu bị động mô tả một quy trình quen thuộc (${n}).`,
  },
  "relative-clauses": {
    rule: "Mệnh đề quan hệ: 'who' cho người, 'which' cho vật, 'that' cho cả người/vật, 'whose' chỉ sở hữu, 'where' chỉ nơi chốn, 'when' chỉ thời gian.",
    trap: "Dùng 'which' cho người hoặc 'who' cho vật — sai. Người dùng 'who/that', vật dùng 'which/that'.",
    speak: (n) => `Kể về 2 người/2 vật bằng mệnh đề quan hệ (${n}).`,
  },
  "modal-verbs": {
    rule: "Động từ khuyết thiếu: 'must' bắt buộc, 'mustn't' cấm, 'should' nên, 'would' giả định/lịch sự, 'can' có thể. Theo sau là V nguyên mẫu (không 'to').",
    trap: "Thêm 'to' sau động từ khuyết thiếu (must to go) — sai; hoặc dùng 'mustn't' khi muốn nói 'không cần' (phải dùng 'don't have to').",
    speak: (n) => `Đưa 2 lời khuyên dùng should/must (${n}).`,
  },
  "gerunds-infinitives": {
    rule: "Sau giới từ và một số động từ (enjoy, avoid, finish, mind) dùng V-ing. Sau một số động từ (decide, want, hope, plan) dùng to + V.",
    trap: "Dùng 'to read' sau 'enjoy' hoặc 'reading' sau 'decide' — sai.",
    speak: (n) => `Nói 2 câu về sở thích (enjoy/like + V-ing) (${n}).`,
  },
  comparatives: {
    rule: "So sánh hơn: tính từ ngắn thêm '-er' (easy → easier); tính từ dài dùng 'more + adj' (more difficult). So sánh nhất: '-est' hoặc 'most + adj'.",
    trap: "Nói 'more easy' (sai, phải là 'easier') hoặc quên 'than' khi so sánh.",
    speak: (n) => `So sánh 2 thứ bạn biết bằng so sánh hơn/nhất (${n}).`,
  },
  "present-perfect-vs-past": {
    rule: "Quá khứ đơn (V2) dùng cho hành động đã kết thúc ở một thời điểm xác định (yesterday, last year). Hiện tại hoàn thành (have/has + V3) dùng cho kết quả còn liên quan hiện tại hoặc trạng từ already/just/ever.",
    trap: "Dùng hiện tại hoàn thành với 'yesterday/last year' (sai) — phải dùng quá khứ đơn.",
    speak: (n) => `Kể 2 việc bạn đã làm (dùng have + V3) (${n}).`,
  },
  "future-forms": {
    rule: "'will + V' cho quyết định tức thì/dự đoán; 'be going to + V' cho dự định đã có hoặc bằng chứng hiển nhiên; 'shall' dùng với I/we (trang trọng).",
    trap: "Dùng 'will' khi có bằng chứng rõ ràng (nhìn mây đen) — nên dùng 'be going to'.",
    speak: (n) => `Nói 2 kế hoạch tương lai của bạn (${n}).`,
  },
  "reported-speech": {
    rule: "Câu tường thuật: lùi thì (backshift) — hiện tại → quá khứ, will → would, can → could; đổi đại từ và trạng từ thời gian/nơi chốn cho phù hợp.",
    trap: "Không lùi thì khi tường thuật (He said he is tired) — sai, phải 'was'.",
    speak: (n) => `Tường thuật lại 2 câu ai đó nói với bạn (${n}).`,
  },
  "used-to": {
    rule: "'used to + V' chỉ thói quen quá khứ đã chấm dứt; 'would + V' cũng chỉ thói quen quá khứ lặp lại; 'be used to + V-ing' nghĩa là 'quen với'.",
    trap: "Nhầm 'used to' (thói quen cũ) với 'be used to' (quen với) — khác nghĩa hoàn toàn.",
    speak: (n) => `Kể 2 thói quen thời thơ ấu bằng used to/would (${n}).`,
  },
  articles: {
    rule: "Mạo từ: 'a' trước phụ âm, 'an' trước nguyên âm (a book, an apple), 'the' cho danh từ xác định, không mạo từ cho danh từ chung chung/số nhiều.",
    trap: "Chọn 'a/an' theo chữ cái đầu thay vì âm đầu (an hour, a university) — phải theo âm.",
    speak: (n) => `Mô tả 2 đồ vật quanh bạn dùng a/an/the (${n}).`,
  },
  prepositions: {
    rule: "Giới từ đi kèm cụm cố định: interested in, good at, depend on, afraid of, proud of. Phải học thuộc từng cụm.",
    trap: "Dịch giới từ từ tiếng Việt (interested 'về' → interested about) — sai, tiếng Anh dùng 'interested in'.",
    speak: (n) => `Nói 2 câu dùng 'interested in' và 'good at' (${n}).`,
  },
  quantifiers: {
    rule: "'much/many': much + danh từ không đếm được, many + đếm được số nhiều. 'a few/fewer' + đếm được; 'a little/less' + không đếm được.",
    trap: "Dùng 'many' với danh từ không đếm được (many water) — sai, phải 'much'.",
    speak: (n) => `Nói 2 câu về số lượng bằng much/many/a few (${n}).`,
  },
  "question-forms": {
    rule: "Câu hỏi Yes/No: Do/Does + S + V (hiện tại đơn), Did + S + V (quá khứ), Be + S (danh từ/tính từ). Câu hỏi Wh-: Wh-word + trợ động từ + S + V.",
    trap: "Dùng 'Does you...' (sai, you → do) hoặc 'Do she...' (sai, she → does).",
    speak: (n) => `Đặt 2 câu hỏi Yes/No và 1 câu hỏi Wh- (${n}).`,
  },
  conjunctions: {
    rule: "Liên từ: 'and' (thêm), 'but' (đối lập), 'so' (kết quả), 'because' (nguyên nhân), 'or' (hoặc).",
    trap: "Dùng 'because' rồi thêm 'so' trong cùng câu (vì... nên...) — sai trong tiếng Anh.",
    speak: (n) => `Nói 2 câu dùng so/but/because (${n}).`,
  },
  "word-order": {
    rule: "Trật tự cơ bản: S + V + O + (nơi chốn) + (thời gian). Trạng từ chỉ mức độ/tần suất (usually, always) đứng trước động từ chính.",
    trap: "Đặt trạng từ chỉ thời gian lên trước động từ (I go usually) — sai, phải 'I usually go'.",
    speak: (n) => `Mô tả 2 hoạt động hằng ngày đúng trật tự từ (${n}).`,
  },
};

function explanationFor(
  topicId: string,
  answerText: string,
  correctIndex: number | null,
  options: string[] | null,
): { explanation_vi: string; vn_trap: string } {
  const rule = RULES[topicId];
  if (!rule) {
    return {
      explanation_vi: `Đáp án đúng là "${answerText}".`,
      vn_trap: "Cần nắm vững quy tắc của chủ điểm này.",
    };
  }

  const chosen =
    correctIndex !== null && options ? options[correctIndex] : answerText;
  let answerNote = "";
  if (correctIndex !== null && options) {
    const wrong = options.filter((_, i) => i !== correctIndex);
    answerNote = ` → "${chosen}" là đáp án đúng; các lựa chọn còn lại (${wrong.join(", ")}) không phù hợp ngữ pháp/ngữ nghĩa ở đây.`;
  } else {
    answerNote = ` → "${chosen}" là đáp án đúng.`;
  }

  return {
    explanation_vi: `${rule.rule}${answerNote}`,
    vn_trap: rule.trap,
  };
}

const SPEAK_EVERY = 5; // 160/800 = 1/5 → mỗi 5 câu (mỗi chủ điểm 10 câu)

function main() {
  const path = join(process.cwd(), "data", "grammar-exercises.json");
  const raw = readFileSync(path, "utf-8");
  const topics = JSON.parse(raw) as Topic[];

  let total = 0;
  let withExplanation = 0;
  let withTrap = 0;
  let withSpeak = 0;

  for (const topic of topics) {
    const rule = RULES[topic.topicId];
    let perTopicIdx = 0;

    const enrich = (
      item: Mcq | Fill,
      correctIndex: number | null,
      options: string[] | null,
    ) => {
      const answerText =
        correctIndex !== null && options ? options[correctIndex] : (item as Fill).answer;
      const { explanation_vi, vn_trap } = explanationFor(
        topic.topicId,
        answerText,
        correctIndex,
        options,
      );
      item.explanation_vi = explanation_vi;
      item.vn_trap = vn_trap;
      withExplanation++;
      withTrap++;
      total++;

      if (perTopicIdx % SPEAK_EVERY === 0 && rule) {
        item.speak = rule.speak(topic.name);
        withSpeak++;
      }
      perTopicIdx++;
    };

    for (const q of topic.mcq) enrich(q, q.answer, q.options);
    for (const q of topic.fill) enrich(q, null, null);
  }

  writeFileSync(path, JSON.stringify(topics, null, 2) + "\n", "utf-8");

  console.log("=== Grammar content fill ===");
  console.log(`topics: ${topics.length}`);
  console.log(`total questions: ${total}`);
  console.log(`with explanation_vi: ${withExplanation}/${total}`);
  console.log(`with vn_trap: ${withTrap}/${total}`);
  console.log(`with speak: ${withSpeak}`);
  if (withExplanation !== total) {
    console.error("FAIL: not all questions have explanation_vi");
    process.exit(1);
  }
  if (withSpeak < 160) {
    console.error(`FAIL: speak ${withSpeak} < 160`);
    process.exit(1);
  }
  console.log("OK");
}

main();
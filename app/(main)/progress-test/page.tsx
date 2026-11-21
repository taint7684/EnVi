import { ProgressTest, type ProgressTestQuestion } from "@/components/progress-test/progress-test";
import { GRAMMAR_EXERCISES } from "@/lib/grammar-exercises-data";
import DICTATION_LESSONS from "@/data/dictation-lessons.json";

export const dynamic = "force-dynamic";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Vocabulary questions from NGSL (top words → meaning MCQ) ──
const VOCAB_WORDS: Array<{ word: string; meaning: string; distractors: string[] }> = [
  { word: "important", meaning: "quan trọng", distractors: ["đắt đỏ", "dễ dàng", "mới mẻ"] },
  { word: "decision", meaning: "quyết định", distractors: ["hộp thư", "điều kiện", "thời gian"] },
  { word: "meeting", meaning: "cuộc họp", distractors: ["thức dậy", "đến muộn", "xe buýt"] },
  { word: "project", meaning: "dự án", distractors: ["cửa sổ", "bàn phím", "máy in"] },
  { word: "requirement", meaning: "yêu cầu", distractors: ["giải pháp", "kết quả", "phản hồi"] },
  { word: "schedule", meaning: "lịch trình", distractors: ["tài khoản", "mật khẩu", "thư mục"] },
  { word: "deadline", meaning: "hạn chót", distractors: ["điểm đầu", "khởi đầu", "bước nhảy"] },
  { word: "budget", meaning: "ngân sách", distractors: ["bảng màu", "bản thiết kế", "hợp đồng"] },
  { word: "client", meaning: "khách hàng", distractors: ["đối thủ", "đồng nghiệp", "quản lý"] },
  { word: "report", meaning: "báo cáo", distractors: ["mẫu biểu", "liên hệ", "tài liệu"] },
  { word: "update", meaning: "cập nhật", distractors: ["xóa bỏ", "sao chép", "in ấn"] },
  { word: "review", meaning: "xem lại", distractors: ["viết lại", "nói lại", "đọc lại"] },
  { word: "feedback", meaning: "phản hồi", distractors: ["chỉ thị", "lệnh", "yêu cầu"] },
  { word: "agenda", meaning: "trình tự", distractors: ["tài liệu", "bảng giá", "hợp đồng"] },
  { word: "stakeholder", meaning: "các bên liên quan", distractors: ["nhà đầu tư", "khách hàng", "nhân viên"] },
  { word: "milestone", meaning: "mốc quan trọng", distractors: ["điểm bắt đầu", "điểm kết thúc", "điểm trung gian"] },
  { word: "deliverable", meaning: "kết quả giao", distractors: ["tiến độ", "chi phí", "rủi ro"] },
  { word: "alignment", meaning: "sự nhất quán", distractors: ["sự khác biệt", "sự đối lập", "sự mâu thuẫn"] },
  { word: "negotiation", meaning: "thương lượng", distractors: ["hợp đồng", "kiểm tra", "đánh giá"] },
];

function buildVocabQuestions(): ProgressTestQuestion[] {
  const shuffled = shuffle(VOCAB_WORDS);
  return shuffled.slice(0, 10).map((w, i) => {
    const options = shuffle([w.meaning, ...w.distractors]);
    return {
      key: `vocab-${i}`,
      topicId: "vocab",
      topicName: "Từ vựng",
      kind: "mcq" as const,
      prompt: `Từ "${w.word}" có nghĩa là gì?`,
      options,
      answer: options.indexOf(w.meaning),
    };
  });
}

// ── Grammar questions from existing data ──
function buildGrammarQuestions(): ProgressTestQuestion[] {
  const pool: ProgressTestQuestion[] = [];
  for (const topic of GRAMMAR_EXERCISES) {
    for (const q of topic.mcq) {
      pool.push({
        key: `grammar-${topic.topicId}-mcq-${q.id}`,
        topicId: topic.topicId,
        topicName: topic.nameVi || topic.name,
        kind: "mcq",
        prompt: q.question,
        options: q.options,
        answer: q.answer,
      });
    }
    for (const q of topic.fill) {
      pool.push({
        key: `grammar-${topic.topicId}-fill-${q.id}`,
        topicId: topic.topicId,
        topicName: topic.nameVi || topic.name,
        kind: "fill",
        prompt: q.question,
        answer: q.answer,
      });
    }
  }
  return shuffle(pool).slice(0, 5);
}

interface DictationLesson {
  id: string;
  title: string;
  titleVi?: string;
  level?: string;
  duration?: string;
  videoUrl?: string;
  thumbnail?: string;
  transcript?: string;
}

// ── Listening questions from dictation lessons ──
function buildListeningQuestions(): ProgressTestQuestion[] {
  const lessons = shuffle(DICTATION_LESSONS as DictationLesson[]);
  return lessons.slice(0, 5).map((lesson, i) => {
    const transcript = lesson.transcript || "";
    const words = transcript.split(/\s+/);
    const targetWord = words[Math.floor(Math.random() * words.length)].replace(/[.,!?]/g, "");

    return {
      key: `listening-${i}`,
      topicId: "listening",
      topicName: "Nghe hiểu",
      kind: "mcq",
      prompt: lesson.titleVi || lesson.title,
      options: [
        targetWord,
        ...shuffle(words.filter((w: string) => w !== targetWord && w.length > 3)).slice(0, 3),
      ],
      answer: 0,
      audioUrl: lesson.videoUrl,
      transcript,
    } as ProgressTestQuestion & { audioUrl?: string; transcript?: string };
  });
}

export default function ProgressTestPage() {
  const vocabQuestions = buildVocabQuestions();
  const grammarQuestions = buildGrammarQuestions();
  const listeningQuestions = buildListeningQuestions();

  const allQuestions = [...vocabQuestions, ...grammarQuestions, ...listeningQuestions];

  return (
    <div className="py-4">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Kiểm tra tiến độ 14 ngày
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          20 câu (10 từ vựng + 5 ngữ pháp + 5 nghe) · Chấm điểm & lưu lịch sử
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 text-center mb-8">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-2xl font-bold text-primary">10</span>
          <p className="mt-1 text-xs text-muted-foreground">Từ vựng</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-2xl font-bold text-primary">5</span>
          <p className="mt-1 text-xs text-muted-foreground">Ngữ pháp</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <span className="text-2xl font-bold text-primary">5</span>
          <p className="mt-1 text-xs text-muted-foreground">Nghe hiểu</p>
        </div>
      </div>

      <ProgressTest questions={allQuestions} />
    </div>
  );
}

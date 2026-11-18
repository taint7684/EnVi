import { ProgressTest, type ProgressTestQuestion } from "@/components/progress-test/progress-test";
import { GRAMMAR_EXERCISES } from "@/lib/grammar-exercises-data";

export const dynamic = "force-dynamic";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MCQ_COUNT = 12;
const FILL_COUNT = 8;

function buildQuestions(): ProgressTestQuestion[] {
  const mcqPool: ProgressTestQuestion[] = [];
  const fillPool: ProgressTestQuestion[] = [];

  for (const topic of GRAMMAR_EXERCISES) {
    for (const q of topic.mcq) {
      mcqPool.push({
        key: `${topic.topicId}-mcq-${q.id}`,
        topicId: topic.topicId,
        topicName: topic.nameVi || topic.name,
        kind: "mcq",
        prompt: q.question,
        options: q.options,
        answer: q.answer,
      });
    }
    for (const q of topic.fill) {
      fillPool.push({
        key: `${topic.topicId}-fill-${q.id}`,
        topicId: topic.topicId,
        topicName: topic.nameVi || topic.name,
        kind: "fill",
        prompt: q.question,
        answer: q.answer,
      });
    }
  }

  const mcq = shuffle(mcqPool).slice(0, MCQ_COUNT);
  const fill = shuffle(fillPool).slice(0, FILL_COUNT);
  return shuffle([...mcq, ...fill]);
}

export default function ProgressTestPage() {
  const questions = buildQuestions();

  return (
    <div className="py-4">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Kiểm tra tiến độ
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          20 câu ngẫu nhiên (12 trắc nghiệm + 8 điền từ) · Chấm điểm & lưu lịch sử
        </p>
      </div>

      <ProgressTest questions={questions} />
    </div>
  );
}
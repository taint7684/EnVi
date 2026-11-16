type Tense = {
  id: string;
  name: string;
  nameVi: string;
  formula: string;
  example: string;
  explanation: string;
};

type Quiz = {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
};

const TENSES: Tense[] = [
  {
    id: "present-simple",
    name: "Present Simple",
    nameVi: "Thì Hiện Tại Đơn",
    formula: "S + V(s/es) / do/does + not + V",
    example: "She works at a bank. / They don't play football.",
    explanation: "Dùng cho thói quen, sự thật hiển nhiên, lịch trình cố định.",
  },
  {
    id: "present-continuous",
    name: "Present Continuous",
    nameVi: "Thì Hiện Tại Tiếp Diễn",
    formula: "S + am/is/are + V-ing",
    example: "I am studying English. / He is not sleeping.",
    explanation: "Dùng cho hành động đang diễn ra tại thời điểm nói.",
  },
  {
    id: "present-perfect",
    name: "Present Perfect",
    nameVi: "Thì Hiện Tại Hoàn Thành",
    formula: "S + have/has + V3",
    example: "I have finished my homework. / She hasn't arrived yet.",
    explanation: "Dùng cho hành động đã hoàn thành nhưng không nói rõ thời gian.",
  },
  {
    id: "past-simple",
    name: "Past Simple",
    nameVi: "Thì Quá Khứ Đơn",
    formula: "S + V2 / did + not + V",
    example: "We visited Paris last year. / He didn't go to school.",
    explanation: "Dùng cho hành động đã xảy ra và kết thúc trong quá khứ.",
  },
  {
    id: "future-simple",
    name: "Future Simple",
    nameVi: "Thì Tương Lai Đơn",
    formula: "S + will + V",
    example: "I will call you tomorrow. / She won't be late.",
    explanation: "Dùng cho quyết định tức thời, dự đoán, lời hứa.",
  },
  {
    id: "future-near",
    name: "Future Near",
    nameVi: "Thì Tương Lai Gần",
    formula: "S + am/is/are + going to + V",
    example: "I am going to travel next month. / They aren't going to come.",
    explanation: "Dùng cho kế hoạch đã định trước, dự đoán dựa trên bằng chứng.",
  },
];

const QUIZZES: Quiz[] = [
  {
    id: 1,
    question: "She _____ to school every day.",
    options: ["go", "goes", "going", "went"],
    correct: 1,
    explanation: "Thì hiện tại đơn với chủ ngữ số ít (she) → thêm 's' vào động từ.",
  },
  {
    id: 2,
    question: "Look! The baby _____ now.",
    options: ["sleeps", "slept", "is sleeping", "has slept"],
    correct: 2,
    explanation: "Thì hiện tại tiếp diễn: am/is/are + V-ing. Dùng 'is' với 'the baby'.",
  },
  {
    id: 3,
    question: "I _____ my homework already.",
    options: ["finish", "finished", "have finished", "am finishing"],
    correct: 2,
    explanation: "Thì hiện tại hoàn thành: have/has + V3. Dùng 'have' với 'I'.",
  },
  {
    id: 4,
    question: "They _____ to Paris last summer.",
    options: ["go", "goes", "went", "have gone"],
    correct: 2,
    explanation: "Thì quá khứ đơn: V2. 'Go' → 'went'. Dùng 'last summer' làm mốc thời gian.",
  },
  {
    id: 5,
    question: "I think it _____ rain tomorrow.",
    options: ["will", "is going to", "was", "would"],
    correct: 0,
    explanation: "Thì tương lai đơn: will + V. Dùng cho dự đoán dựa trên ý kiến cá nhân.",
  },
  {
    id: 6,
    question: "We _____ visit our grandparents next week.",
    options: ["will", "are going to", "were", "did"],
    correct: 1,
    explanation: "Thì tương lai gần: am/is/are + going to + V. Dùng cho kế hoạch đã định.",
  },
  {
    id: 7,
    question: "He _____ TV when I called him.",
    options: ["watches", "watched", "was watching", "has watched"],
    correct: 2,
    explanation: "Thì quá khứ tiếp diễn: was/were + V-ing. Dùng cho hành động đang diễn ra tại một thời điểm trong quá khứ.",
  },
  {
    id: 8,
    question: "By next year, I _____ here for ten years.",
    options: ["work", "worked", "will have worked", "have worked"],
    correct: 2,
    explanation: "Thì tương lai hoàn thành: will have + V3. Dùng cho hành động sẽ hoàn thành trước một thời điểm trong tương lai.",
  },
];

export function GrammarContent() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {TENSES.map((tense) => (
          <div
            key={tense.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <h3 className="font-medium">{tense.name}</h3>
            <p className="text-sm text-muted-foreground">{tense.nameVi}</p>
            <div className="mt-2 rounded-lg bg-accent/50 p-2">
              <code className="text-sm">{tense.formula}</code>
            </div>
            <p className="mt-2 text-sm">{tense.example}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {tense.explanation}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 font-serif text-lg font-semibold">Bài tập trắc nghiệm</h3>
        <div className="space-y-4">
          {QUIZZES.map((quiz) => (
            <div
              key={quiz.id}
              className="rounded-lg border border-border p-4"
            >
              <p className="mb-2 font-medium">
                {quiz.id}. {quiz.question}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {quiz.options.map((opt, i) => (
                  <div
                    key={i}
                    className="rounded-lg bg-muted px-3 py-2 text-sm"
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-sm text-green-700">
                Đáp án: {String.fromCharCode(65 + quiz.correct)}. {quiz.options[quiz.correct]}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {quiz.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
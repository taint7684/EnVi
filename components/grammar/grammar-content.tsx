"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { CollocationsView } from "@/components/grammar/collocations-view";
import { GrammarPractice } from "@/components/grammar/grammar-practice";
import { CollocationsPractice } from "@/components/grammar/collocations-practice";

type GrammarTopic = {
  id: string;
  name: string;
  nameVi: string;
  formula: string;
  example: string;
  explanation: string;
  quizzes: {
    id: number;
    question: string;
    options: string[];
    correct: number;
    explanation: string;
  }[];
};

const B1_B2_TOPICS: GrammarTopic[] = [
  {
    id: "conditionals",
    name: "Conditional Sentences",
    nameVi: "Câu Điều Kiện",
    formula: "If + present, will + V / If + past, would + V / If + past perfect, would have + V3",
    example: "If it rains, I will stay home. / If I were rich, I would travel. / If I had known, I would have come.",
    explanation: "Loại 1: thực tế có thể xảy ra. Loại 2: giả định không thực tế hiện tại. Loại 3: giả định quá khứ.",
    quizzes: [
      { id: 1, question: "If I _____ more time, I would learn another language.", options: ["have", "had", "will have", "having"], correct: 1, explanation: "Câu điều kiện loại 2: If + quá khứ đơn, would + V." },
      { id: 2, question: "If she had studied harder, she _____ the exam.", options: ["passes", "will pass", "would have passed", "had passed"], correct: 2, explanation: "Câu điều kiện loại 3: If + quá khứ hoàn thành, would have + V3." },
      { id: 3, question: "If it _____ tomorrow, we'll cancel the picnic.", options: ["rains", "rained", "will rain", "raining"], correct: 0, explanation: "Câu điều kiện loại 1: If + hiện tại đơn, will + V." },
    ],
  },
  {
    id: "passive",
    name: "Passive Voice",
    nameVi: "Câu Bị Động",
    formula: "S + be + V3 (+ by O)",
    example: "The book was written by him. / English is spoken worldwide.",
    explanation: "Dùng khi muốn nhấn mạnh đối tượng bị tác động hoặc khi không biết ai thực hiện hành động.",
    quizzes: [
      { id: 1, question: "The homework _____ by the students yesterday.", options: ["completed", "was completed", "is completed", "has completed"], correct: 1, explanation: "Quá khứ đơn bị động: was/were + V3." },
      { id: 2, question: "This bridge _____ in 1990.", options: ["builds", "was built", "built", "is building"], correct: 1, explanation: "Quá khứ đơn bị động: was/were + V3." },
      { id: 3, question: "English _____ in many countries.", options: ["speaks", "is spoken", "spoke", "speaking"], correct: 1, explanation: "Hiện tại đơn bị động: is/are + V3." },
    ],
  },
  {
    id: "relative-clauses",
    name: "Relative Clauses",
    nameVi: "Mệnh Đề Quan Hệ",
    formula: "N + who/which/that + V / N + whose + N + V",
    example: "The man who lives next door is a doctor. / The book that I read was interesting.",
    explanation: "Who: người. Which: vật. That: người/vật. Whose: sở hữu.",
    quizzes: [
      { id: 1, question: "The woman _____ lives upstairs is a teacher.", options: ["who", "which", "where", "when"], correct: 0, explanation: "Who dùng cho người." },
      { id: 2, question: "This is the book _____ I told you about.", options: ["who", "which", "where", "whose"], correct: 1, explanation: "Which dùng cho vật." },
      { id: 3, question: "The house _____ roof is red belongs to my uncle.", options: ["who", "which", "whose", "that"], correct: 2, explanation: "Whose chỉ sở hữu." },
    ],
  },
  {
    id: "modal-verbs",
    name: "Modal Verbs",
    nameVi: "Động Từ Khuyết Thiếu",
    formula: "can/could/may/might/must/should/would + V",
    example: "You should see a doctor. / She can speak three languages. / It might rain later.",
    explanation: "Can: khả năng. Could: quá khứ của can hoặc khả năng. Must: bắt buộc. Should: nên. Might: có thể.",
    quizzes: [
      { id: 1, question: "You _____ smoke here. It's forbidden.", options: ["must", "mustn't", "should", "can"], correct: 1, explanation: "Mustn't: cấm, không được phép." },
      { id: 2, question: "If I were you, I _____ apologize.", options: ["will", "would", "am", "do"], correct: 1, explanation: "Would dùng trong câu điều kiện loại 2." },
      { id: 3, question: "She _____ speak French fluently.", options: ["can", "must", "should", "may"], correct: 0, explanation: "Can: có khả năng làm gì." },
    ],
  },
  {
    id: "gerunds-infinitives",
    name: "Gerunds & Infinitives",
    nameVi: "Danh Động Từ & Động Từ Nguyên Mẫu",
    formula: "V-ing / to + V",
    example: "I enjoy reading. / I want to travel. / She decided to study abroad.",
    explanation: "Một số động từ theo sau là V-ing (enjoy, avoid, finish), một số là to + V (want, decide, hope).",
    quizzes: [
      { id: 1, question: "I enjoy _____ books in my free time.", options: ["read", "reading", "to read", "reads"], correct: 1, explanation: "Enjoy + V-ing." },
      { id: 2, question: "She decided _____ a new car.", options: ["buy", "buying", "to buy", "bought"], correct: 2, explanation: "Decide + to + V." },
      { id: 3, question: "He avoided _____ the question.", options: ["answer", "to answer", "answering", "answered"], correct: 2, explanation: "Avoid + V-ing." },
    ],
  },
  {
    id: "comparatives",
    name: "Comparatives & Superlatives",
    nameVi: "So Sánh Hơn & Nhất",
    formula: "S + be + -er + than / S + be + the + -est",
    example: "This book is more interesting than that one. / She is the tallest in her class.",
    explanation: "So sánh hơn: -er + than hoặc more + adjective + than. So sánh nhất: the + -est hoặc the most + adjective.",
    quizzes: [
      { id: 1, question: "This exercise is _____ than the last one.", options: ["easy", "easier", "easiest", "more easy"], correct: 1, explanation: "So sánh hơn của 'easy' là 'easier'." },
      { id: 2, question: "She is the _____ student in the class.", options: ["smart", "smarter", "smartest", "most smart"], correct: 2, explanation: "So sánh nhất: the + -est." },
      { id: 3, question: "My new phone is _____ than my old one.", options: ["good", "better", "best", "more good"], correct: 1, explanation: "So sánh hơn của 'good' là 'better'." },
    ],
  },
  {
    id: "present-perfect-vs-past",
    name: "Present Perfect vs Past Simple",
    nameVi: "Phân Biệt Hiện Tại Hoàn Thành và Quá Khứ Đơn",
    formula: "have/has + V3 (kết quả đến hiện tại) / V2 (đã kết thúc)",
    example: "I have lost my keys. (chưa tìm thấy) / I lost my keys yesterday. (đã xảy ra)",
    explanation: "Hiện tại hoàn thành: không nói rõ thời gian hoặc kết quả liên quan đến hiện tại. Quá khứ đơn: có mốc thời gian cụ thể trong quá khứ.",
    quizzes: [
      { id: 1, question: "I _____ my homework already.", options: ["finish", "finished", "have finished", "am finishing"], correct: 2, explanation: "Already + hiện tại hoàn thành." },
      { id: 2, question: "They _____ to Paris last year.", options: ["have gone", "went", "go", "have been"], correct: 1, explanation: "Last year là mốc thời gian cụ thể → quá khứ đơn." },
      { id: 3, question: "She _____ never _____ sushi.", options: ["has/eaten", "have/eaten", "has/ate", "had/eat"], correct: 0, explanation: "Never + hiện tại hoàn thành." },
    ],
  },
  {
    id: "future-forms",
    name: "Future Forms",
    nameVi: "Các Dạng Tương Lai",
    formula: "will + V / be going to + V / present continuous (kế hoạch)",
    example: "I will help you. / I'm going to study tonight. / I'm meeting John at 5 PM.",
    explanation: "Will: quyết định tức thời, dự đoán. Be going to: kế hoạch đã định. Present continuous: kế hoạch chắc chắn.",
    quizzes: [
      { id: 1, question: "Look at those clouds! It _____ rain.", options: ["will", "is going to", "would", "shall"], correct: 1, explanation: "Be going to: dự đoán dựa trên bằng chứng." },
      { id: 2, question: "I _____ call you tomorrow.", options: ["will", "am going to", "would", "shall"], correct: 0, explanation: "Will: quyết định tức thời." },
      { id: 3, question: "She _____ her grandmother this weekend.", options: ["will visit", "is going to visit", "visits", "would visit"], correct: 1, explanation: "Be going to: kế hoạch đã định." },
    ],
  },
  {
    id: "reported-speech",
    name: "Reported Speech",
    nameVi: "Câu Gián Tiếp",
    formula: "S + said/told + (that) + S + V (lùi thì)",
    example: "He said (that) he was tired. / She told me she would come.",
    explanation: "Khi tường thuật lời nói, thường lùi thì: hiện tại → quá khứ, quá khứ → quá khứ hoàn thành, will → would.",
    quizzes: [
      { id: 1, question: "He said that he _____ tired.", options: ["is", "was", "has been", "will be"], correct: 1, explanation: "Hiện tại → quá khứ: is → was." },
      { id: 2, question: "She told me she _____ help me.", options: ["will", "would", "can", "shall"], correct: 1, explanation: "Will → would trong câu gián tiếp." },
      { id: 3, question: "They said they _____ finished the project.", options: ["have", "had", "has", "having"], correct: 1, explanation: "Hiện tại hoàn thành → quá khứ hoàn thành: have finished → had finished." },
    ],
  },
  {
    id: "used-to",
    name: "Used to / Would for Past Habits",
    nameVi: "Thói Quen Trong Quá Khứ",
    formula: "used to + V / would + V",
    example: "I used to play tennis. / She would always arrive early.",
    explanation: "Used to: thói quen hoặc trạng thái trong quá khứ đã thay đổi. Would: thói quen lặp lại trong quá khứ.",
    quizzes: [
      { id: 1, question: "I _____ smoke when I was younger.", options: ["use to", "used to", "am used to", "was used to"], correct: 1, explanation: "Used to + V: thói quen trong quá khứ." },
      { id: 2, question: "She _____ always bring an umbrella.", options: ["used to", "would", "was", "did"], correct: 1, explanation: "Would + V: thói quen lặp lại trong quá khứ." },
      { id: 3, question: "I didn't _____ like coffee, but now I do.", options: ["used to", "use to", "would", "am used to"], correct: 1, explanation: "Didn't use to: phủ định của used to." },
    ],
  },
  {
    id: "articles",
    name: "Articles",
    nameVi: "Mạo Từ",
    formula: "a/an + N số ít / the + N xác định",
    example: "I saw an elephant. / The sun rises in the east.",
    explanation: "a: trước phụ âm. an: trước nguyên âm. the: danh từ xác định.",
    quizzes: [],
  },
  {
    id: "prepositions",
    name: "Prepositions",
    nameVi: "Giới Từ",
    formula: "in / on / at + thời gian, địa điểm",
    example: "at 5 o'clock / on Monday / in July",
    explanation: "at: giờ, địa điểm cụ thể. on: ngày, bề mặt. in: tháng, năm, không gian kín.",
    quizzes: [],
  },
  {
    id: "quantifiers",
    name: "Quantifiers",
    nameVi: "Lượng Từ",
    formula: "many + đếm được / much + không đếm được",
    example: "many books / much water",
    explanation: "many/few: danh từ đếm được. much/little: danh từ không đếm được.",
    quizzes: [],
  },
  {
    id: "question-forms",
    name: "Question Forms",
    nameVi: "Dạng Câu Hỏi",
    formula: "(Wh-) + trợ động từ + S + V?",
    example: "Where does he work? / Do you like coffee?",
    explanation: "Trợ động từ (do/does/did/be/have) đứng trước chủ ngữ.",
    quizzes: [],
  },
  {
    id: "conjunctions",
    name: "Conjunctions",
    nameVi: "Liên Từ",
    formula: "and / but / or / because / so",
    example: "I was tired, so I went to bed.",
    explanation: "and: thêm. but: đối lập. because: nguyên nhân. so: kết quả.",
    quizzes: [],
  },
  {
    id: "word-order",
    name: "Word Order",
    nameVi: "Trật Tự Từ",
    formula: "S + V + O + Manner + Place + Time",
    example: "She reads books every day.",
    explanation: "Trật tự: Chủ ngữ - Động từ - Tân ngữ - cách thức - nơi chốn - thời gian.",
    quizzes: [],
  },
];

export function GrammarContent() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [view, setView] = useState<
    "grammar" | "collocations" | "phrasal" | "practice"
  >("grammar");

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const TABS = [
    { id: "grammar", label: "Ngữ pháp" },
    { id: "collocations", label: "Collocations" },
    { id: "phrasal", label: "Phrasal Verbs" },
    { id: "practice", label: "Practice" },
  ] as const;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={cn(
              "flex-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              view === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "practice" ? <CollocationsPractice /> : null}

      {view === "grammar" ? (
        <p className="text-sm text-muted-foreground">
          Học 16 chủ điểm ngữ pháp và luyện tập với Practice Hub (10 câu ngẫu nhiên mỗi lần).
        </p>
      ) : null}

      {view === "collocations" || view === "phrasal" ? (
        <CollocationsView type={view === "phrasal" ? "phrasal" : "collocation"} />
      ) : null}

      {view === "grammar" ? (
        B1_B2_TOPICS.map((topic) => (
        <div
          key={topic.id}
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          <button
            onClick={() => toggleExpand(topic.id)}
            className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-accent/40"
          >
            <div>
              <h3 className="font-medium">{topic.name}</h3>
              <p className="text-sm text-muted-foreground">{topic.nameVi}</p>
            </div>
            {expandedId === topic.id ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>

          {expandedId === topic.id && (
            <div className="border-t border-border p-4">
              <div className="mb-4 rounded-lg bg-accent/50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase text-muted-foreground">
                  Công thức
                </p>
                <code className="text-sm">{topic.formula}</code>
                <p className="mt-2 text-sm">{topic.example}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {topic.explanation}
                </p>
              </div>

              <GrammarPractice topicId={topic.id} />
            </div>
          )}
        </div>
      ))
      ) : null}
    </div>
  );
}
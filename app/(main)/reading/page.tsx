import { ReadingPractice } from "@/components/reading/reading-practice";

export default function ReadingPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 font-serif text-2xl font-semibold">Đọc hiểu</h1>
      <p className="mb-6 text-muted-foreground">
        Thư viện 30 bài đọc chia 3 cấp độ A2/B1/B2, mỗi bài có 5 câu hỏi trắc
        nghiệm hiểu ý.
      </p>

      <ReadingPractice />
    </div>
  );
}
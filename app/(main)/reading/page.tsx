import { ReadingPractice } from "@/components/reading/reading-practice";

export default function ReadingPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 font-serif text-2xl font-semibold">Đọc to</h1>
      <p className="mb-6 text-muted-foreground">
        Đọc to đoạn văn và ghi âm để luyện phát âm.
      </p>

      <ReadingPractice />
    </div>
  );
}
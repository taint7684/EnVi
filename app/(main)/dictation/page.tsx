import { DictationGame } from "@/components/dictation/dictation-game";

export default function DictationPage() {
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 font-serif text-2xl font-semibold">Dictation</h1>
      <p className="mb-6 text-muted-foreground">
        Nghe và gõ lại câu. Hệ thống sẽ kiểm tra và hiển thị từ đúng (xanh) / sai (đỏ).
      </p>

      <DictationGame />
    </div>
  );
}
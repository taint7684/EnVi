import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";

type MakeupLesson = {
  id: string;
  pattern_key: string;
  status: string;
  content: unknown;
  progress: unknown;
  score: number | null;
  created_at: string;
  completed_at: string | null;
};

export default async function MakeupLessonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: lesson, error } = await supabase
    .from("makeup_lessons")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !lesson) notFound();

  const contentPreview =
    typeof lesson.content === "object" && lesson.content !== null
      ? JSON.stringify(lesson.content, null, 2)
      : "Chưa có nội dung.";

  async function handleComplete() {
    const s = await createClient();
    const { error: updError } = await s
      .from("makeup_lessons")
      .update({
        status: "done",
        score: 100,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (updError) throw new Error(updError.message);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Bài bù</h1>
        <a
          href="/errors"
          className="inline-flex items-center rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-foreground"
        >
          Về sổ lỗi
        </a>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <p className="text-muted-foreground text-sm">Mẫu lỗi: {lesson.pattern_key}</p>
        <p className="text-muted-foreground text-sm">
          Trạng thái:{" "}
          <span className="font-medium">{lesson.status}</span>
        </p>
        {lesson.score != null && (
          <p className="text-muted-foreground text-sm">Điểm: {lesson.score}</p>
        )}
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="text-lg font-semibold mb-3">Nội dung luyện tập</h2>
        <div className="text-muted-foreground text-sm max-w-prose">
          {contentPreview}
        </div>
      </div>

      {lesson.status !== "done" && (
        <form action={handleComplete}>
          <Button type="submit">Đã hoàn thành bài bù</Button>
        </form>
      )}
    </div>
  );
}

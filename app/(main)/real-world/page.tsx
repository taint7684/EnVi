import { getRealWorldWeeklyTasks, getNextTask } from "@/lib/realworld/server";
import { RealWorldBridge } from "@/components/realworld/real-world-bridge";
import type { RealWorldWeeklyTask } from "@/lib/realworld/server";

export const metadata = { title: "Bước ra đời thật — EnVi" };

export default async function RealWorldPage() {
  const [tasks, next] = await Promise.all([
    getRealWorldWeeklyTasks(),
    getNextTask(),
  ]);
  
  // Get completed task IDs from logs
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let doneIds: string[] = [];
  if (user) {
    const { data } = await supabase
      .from("real_world_logs")
      .select("task_id")
      .eq("user_id", user.id);
    doneIds = Array.from(new Set((data ?? []).map((r) => r.task_id as string)));
  }
  const done = new Set(doneIds);
  const completed = tasks.filter((t) => done.has(t.template_id)).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Bước ra đời thật</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thang tăng dần: nói một mình → với AI → nghe lại → nói với người thật.
          Đừng chờ "sẵn sàng 100%" — làm bước kế tiếp, ghi lại cảm giác.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Tuần {getCurrentWeek()}/26 · Đã hoàn thành <span className="font-medium text-foreground">{completed}</span>/26 tuần.
        </p>
      </div>

      {next && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
          <span className="text-xs font-medium uppercase text-primary">Tuần {next.week_num} · Bước kế tiếp</span>
          <p className="mt-1 font-medium">{next.title_vi}</p>
          <p className="text-sm text-muted-foreground">{next.scenario_vi}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">Mở đầu: {next.prep_openers[0]}</span>
            <span className="rounded bg-rose/10 px-2 py-0.5 text-xs text-rose-600">Cứu nguy: {next.prep_rescues[0]}</span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {tasks.map((t) => (
          <RealWorldBridge
            key={t.id}
            task={{
              id: t.template_id,
              step: t.week_num,
              title_vi: t.title_vi,
              description_vi: t.scenario_vi,
            }}
            done={done.has(t.template_id)}
            isNext={next?.template_id === t.template_id}
          />
        ))}
      </div>
    </div>
  );
}

function getCurrentWeek(): number {
  // This is a placeholder - in real app, fetch from curriculum_progress
  return 1;
}

// Need to import createClient for server component
import { createClient } from "@/lib/supabase/server";
import { getRealWorldTasks, getDoneTaskIds } from "@/lib/realworld/server";
import { nextTask } from "@/lib/realworld/catalog";
import { RealWorldBridge } from "@/components/realworld/real-world-bridge";

export const metadata = { title: "Bước ra đời thật — EnVi" };

export default async function RealWorldPage() {
  const [tasks, doneIds] = await Promise.all([
    getRealWorldTasks(),
    getDoneTaskIds(),
  ]);
  const done = new Set(doneIds);
  const next = nextTask(doneIds);
  const completed = tasks.filter((t) => done.has(t.id)).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Bước ra đời thật</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Thang tăng dần: nói một mình → với AI → nghe lại → nói với người thật.
          Đừng chờ “sẵn sàng 100%” — làm bước kế tiếp, ghi lại cảm giác.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Đã hoàn thành <span className="font-medium text-foreground">{completed}</span>/{tasks.length} bước.
        </p>
      </div>

      {next && (
        <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
          <span className="text-xs font-medium uppercase text-primary">Bước kế tiếp của bạn</span>
          <p className="mt-1 font-medium">{next.title_vi}</p>
          <p className="text-sm text-muted-foreground">{next.description_vi}</p>
        </div>
      )}

      <div className="space-y-4">
        {tasks.map((t) => (
          <RealWorldBridge
            key={t.id}
            task={t}
            done={done.has(t.id)}
            isNext={next?.id === t.id}
          />
        ))}
      </div>
    </div>
  );
}
import { createClient } from "@/lib/supabase/server";
import { getErrors, type ErrorPatternRow, type ErrorEventRow } from "@/lib/errors";
import { PatternStatusButton } from "@/components/errors/pattern-status";

export default async function ErrorsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let patterns: ErrorPatternRow[] = [];
  let events: ErrorEventRow[] = [];
  let error: string | null = null;

  if (user) {
    try {
      const data = await getErrors({ userId: user.id, pageSize: 100 });
      patterns = data.patterns;
      events = data.events;
    } catch (err) {
      error = err instanceof Error ? err.message : "Lỗi tải sổ lỗi";
    }
  }

  const statusColor: Record<string, string> = {
    new: "bg-amber-100 text-amber-800",
    practicing: "bg-blue-100 text-blue-800",
    mastered: "bg-emerald-100 text-emerald-800",
    dismissed: "bg-slate-100 text-slate-600",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sổ lỗi</h1>
          <p className="text-muted-foreground">
            Gom các sai lầm của bạn theo mẫu để luyện bài bù.
          </p>
        </div>
        {!user && (
          <a
            href="/login"
            className="inline-flex items-center rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground text-foreground"
          >
            Đăng nhập
          </a>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Mẫu lỗi của bạn</h2>
        {patterns.length === 0 ? (
          <p className="text-muted-foreground">Chưa có lỗi nào được ghi.</p>
        ) : (
          <div className="rounded-lg border bg-card p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left pb-2 pr-2">Mẫu lỗi</th>
                  <th className="text-left pb-2 pr-2">Lần</th>
                  <th className="text-left pb-2 pr-2">Trạng thái</th>
                  <th className="text-left pb-2 pr-2">Xét lại vào</th>
                  <th className="text-right pb-2 pr-2">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {patterns.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-3 pr-2 font-medium">{p.pattern_key}</td>
                    <td className="py-3 pr-2">{p.count}</td>
                    <td className="py-3 pr-2">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${statusColor[p.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-muted-foreground">
                      {p.next_check_at ? new Date(p.next_check_at).toLocaleDateString("vi-VN") : "—"}
                    </td>
                    <td className="py-3 pr-2 text-right">
                      <PatternStatusButton
                        userId={user?.id ?? ""}
                        patternKey={p.pattern_key}
                        status={p.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Khoảng cách chi tiết gần đây</h2>
        {events.length === 0 ? (
          <p className="text-muted-foreground">Chưa có sự kiện lỗi nào.</p>
        ) : (
          <div className="rounded-lg border bg-card p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left pb-2 pr-2">Nguồn</th>
                  <th className="text-left pb-2 pr-2">Loại</th>
                  <th className="text-left pb-2 pr-2">Mẫu</th>
                  <th className="text-left pb-2 pr-2">Sai</th>
                  <th className="text-left pb-2 pr-2">Đúng</th>
                  <th className="text-left pb-2 pr-2">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-2 pr-2">{e.source}</td>
                    <td className="py-2 pr-2 text-muted-foreground">{e.type}</td>
                    <td className="py-2 pr-2 font-medium">{e.pattern_key}</td>
                    <td className="py-2 pr-2 truncate max-w-[120px]">{e.original}</td>
                    <td className="py-2 pr-2 text-emerald-600 truncate max-w-[120px]">{e.correction}</td>
                    <td className="py-2 pr-2 text-muted-foreground">
                      {new Date(e.created_at).toLocaleString("vi-VN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

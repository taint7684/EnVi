import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 50);

  if (!q) {
    return Response.json({ results: [] });
  }

  const supabase = await createClient();
  await supabase.auth.getUser();

  // Tìm theo từ (lemma) hoặc nghĩa Việt (meaning_vi), không phân biệt hoa thường.
  const like = `%${q}%`;
  const { data, error } = await supabase
    .from("words")
    .select("id, lemma, ipa, pos, meaning_vi, example_en, example_vi, topic, cefr_level, audio_url")
    .or(`lemma.ilike.${like},meaning_vi.ilike.${like}`)
    .order("frequency_rank", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    results: (data ?? []).map((w) => ({
      id: w.id,
      word: w.lemma,
      ipa: w.ipa,
      pos: w.pos,
      meaningVi: w.meaning_vi,
      exampleEn: w.example_en,
      exampleVi: w.example_vi,
      topic: w.topic,
      level: w.cefr_level,
      audioUrl: w.audio_url,
    })),
  });
}

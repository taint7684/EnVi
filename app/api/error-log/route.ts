import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ErrorEntry = {
  id: string;
  source: "Writing" | "Speaking" | "Reflex";
  original: string;
  correction: string;
  reason: string;
  category: string;
  date: string;
  status: "pending" | "reviewed" | "dismissed";
};

type FeedbackError = {
  error?: string;
  correction?: string;
  explanation_vi?: string;
};

type FeedbackJson = {
  errors?: FeedbackError[];
  [key: string]: unknown;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ errors: [] });
  }

  const errors: ErrorEntry[] = [];

  // Fetch writing drafts with feedback
  const { data: drafts } = await supabase
    .from("writing_drafts")
    .select("id, prompt_id, feedback_json, updated_at")
    .eq("user_id", user.id)
    .not("feedback_json", "is", null)
    .order("updated_at", { ascending: false })
    .limit(50);

  if (drafts) {
    for (const draft of drafts) {
      const fb = draft.feedback_json as FeedbackJson;
      if (!fb || !fb.errors) continue;
      for (const err of fb.errors) {
        errors.push({
          id: `w-${draft.id}-${err.error?.slice(0, 20)}`,
          source: "Writing",
          original: err.error ?? "",
          correction: err.correction ?? "",
          reason: err.explanation_vi ?? "",
          category: "Ngữ pháp",
          date: draft.updated_at,
          status: "pending",
        });
      }
    }
  }

  // Fetch speaking turns with feedback
  const { data: turns } = await supabase
    .from("speaking_turns")
    .select("id, feedback_json, created_at")
    .eq("user_id", user.id)
    .not("feedback_json", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (turns) {
    for (const turn of turns) {
      const fb = turn.feedback_json as FeedbackJson;
      if (!fb || !fb.errors) continue;
      for (const err of fb.errors) {
        errors.push({
          id: `s-${turn.id}-${err.error?.slice(0, 20)}`,
          source: "Speaking",
          original: err.error ?? "",
          correction: err.correction ?? "",
          reason: err.explanation_vi ?? "",
          category: "Phát âm",
          date: turn.created_at,
          status: "pending",
        });
      }
    }
  }

  // Sort by date descending
  errors.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({ errors });
}

export async function POST(request: Request) {
  const { id } = await request.json().catch(() => ({}));
  // Review/dismiss actions are best-effort; no dedicated table yet.
  // Client-side state is the source of truth until a table exists.
  return NextResponse.json({ ok: true });
}

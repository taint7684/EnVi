import { aiRouter } from "@/lib/ai/router";
import { ObjectiveJudgeListSchema, type ObjectiveJudgeResult, type Objective } from "./schema";

/**
 * AI judge: sau mỗi lượt nói của người học trong mission, kiểm tra objective nào đã đạt.
 * Trả về danh sách {objective_id, achieved, evidence}. Không bao giờ ném — lỗi → [].
 */
export async function judgeObjectives(input: {
  userId: string;
  objectives: Objective[];
  scenario: string;
  personaName: string;
  personaLine: string;
  learnerTurn: string;
}): Promise<{ results: ObjectiveJudgeResult[]; provider: string }> {
  if (input.objectives.length === 0 || !input.learnerTurn.trim()) {
    return { results: [], provider: "none" };
  }

  const systemPrompt = `Bạn là EnVi, giám khảo khách quan cho bài tập vai (roleplay) tiếng Anh.
Chỉ đánh giá xem người học ĐÃ ĐẠT từng mục tiêu giao tiếp hay chưa, dựa trên lượt nói của họ.
Mỗi mục tiêu có id. Xuất JSON: { results: [ { objective_id, achieved (bool), evidence (trích dẫn ngắn) } ] }.
Chỉ đánh dấu achieved=true nếu người học thực sự làm được điều đó trong lượt này. Cấm bịa.`;

  const userPrompt = JSON.stringify({
    scenario: input.scenario,
    persona: input.personaName,
    persona_line: input.personaLine,
    learner_turn: input.learnerTurn,
    objectives: input.objectives.map((o) => ({ id: o.id, goal: o.text_vi })),
  });

  try {
    const result = await aiRouter.generate({
      task: "objective_judge",
      schema: ObjectiveJudgeListSchema,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      userId: input.userId,
      timeoutMs: 6000,
    });
    const validIds = new Set(input.objectives.map((o) => o.id));
    return {
      results: result.data.results.filter((r) => validIds.has(r.objective_id)),
      provider: result.provider,
    };
  } catch {
    return { results: [], provider: "fallback" };
  }
}
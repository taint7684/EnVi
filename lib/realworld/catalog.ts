import { z } from "zod";

export const RealWorldTaskSchema = z.object({
  id: z.string(),
  step: z.number(),
  title_vi: z.string(),
  description_vi: z.string(),
});

export type RealWorldTask = z.infer<typeof RealWorldTaskSchema>;

/**
 * Thang tiếp xúc tăng dần (8.19): nói một mình → với AI → nghe lại → nói với người thật.
 */
export const REAL_WORLD_TASKS: RealWorldTask[] = [
  { id: "voice-note", step: 1, title_vi: "Gửi voice note 60 giây", description_vi: "Ghi âm một đoạn tiếng Anh 60 giây gửi cho bạn bè/đồng nghiệp." },
  { id: "daily-sentence", step: 2, title_vi: "Nói một câu trong daily", description_vi: "Chủ động nói ít nhất một câu tiếng Anh trong buổi daily/standup." },
  { id: "ask-in-meeting", step: 3, title_vi: "Hỏi một câu trong họp", description_vi: "Đặt một câu hỏi hoặc xác nhận lại yêu cầu trong họp với khách." },
  { id: "language-exchange", step: 4, title_vi: "15 phút language exchange", description_vi: "Nói 15 phút với người thật qua HelloTalk/Tandem hoặc gia sư." },
  { id: "small-talk", step: 5, title_vi: "Small talk với người nước ngoài", description_vi: "Chủ động bắt chuyện small talk với người nước ngoài." },
  { id: "present-2min", step: 6, title_vi: "Trình bày 2 phút trong họp", description_vi: "Chủ động trình bày một nội dung 2 phút trong cuộc họp." },
];

/** Trả về nhiệm vụ tiếp theo chưa hoàn thành (theo thứ tự bước). */
export function nextTask(doneIds: string[]): RealWorldTask | null {
  const done = new Set(doneIds);
  return REAL_WORLD_TASKS.find((t) => !done.has(t.id)) ?? null;
}
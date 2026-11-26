export type NewBlockId =
  | "shadowing"
  | "reflex"
  | "picture_talk"
  | "speaking"
  | "chunks"
  | "voice_diary";

export const NEW_BLOCK_DEFS: Record<
  NewBlockId,
  { label: string; minutes: number; speaking: boolean; module: string }
> = {
  shadowing: { label: "Shadowing (nghe & lặp)", minutes: 10, speaking: true, module: "shadowing" },
  reflex: { label: "Reflex (câu phản xạ)", minutes: 20, speaking: true, module: "reflex" },
  picture_talk: { label: "Picture Talk (mô tả ảnh)", minutes: 15, speaking: true, module: "picture_talk" },
  speaking: { label: "AI Speaking (trò chuyện tự do)", minutes: 30, speaking: true, module: "speaking" },
  chunks: { label: "Chunks (cụm từ sẵn sàng)", minutes: 10, speaking: true, module: "chunks" },
  voice_diary: { label: "Voice Diary (nhật ký giọng)", minutes: 5, speaking: true, module: "voice_diary" },
};

export const NEW_ORDER: NewBlockId[] = [
  "shadowing",
  "reflex",
  "picture_talk",
  "speaking",
  "chunks",
  "voice_diary",
];

export const TOTAL_MINUTES = NEW_ORDER.reduce((sum, id) => sum + NEW_BLOCK_DEFS[id].minutes, 0);
export const SPEAKING_MINUTES = NEW_ORDER.filter((id) => NEW_BLOCK_DEFS[id].speaking).reduce((sum, id) => sum + NEW_BLOCK_DEFS[id].minutes, 0);

export function newBlockLabel(id: NewBlockId): string {
  return NEW_BLOCK_DEFS[id]?.label ?? id;
}

export function getFixedDayBlocks(): Array<{ id: NewBlockId; minutes: number; speaking: boolean; module: string; label: string }> {
  return NEW_ORDER.map((id) => ({
    id,
    minutes: NEW_BLOCK_DEFS[id].minutes,
    speaking: NEW_BLOCK_DEFS[id].speaking,
    module: NEW_BLOCK_DEFS[id].module,
    label: NEW_BLOCK_DEFS[id].label,
  }));
}

export function calculateSpeakingPct(blocks: Array<{ minutes: number; speaking: boolean }>): number {
  const total = blocks.reduce((s, b) => s + b.minutes, 0);
  const speaking = blocks.filter((b) => b.speaking).reduce((s, b) => s + b.minutes, 0);
  return total > 0 ? Math.round((speaking / total) * 100) : 0;
}

export function calculateXpTarget(speakingMinutes: number): number {
  return speakingMinutes * 6;
}

export function getBlockConfig(blockId: NewBlockId, dayPlan: { layer?: string; topicId?: string; round?: 1 | 2; phraseCount?: number; imageSetId?: string; scenarioId?: string; chunkKeys?: string[] }) {
  const base = {
    layer: dayPlan.layer,
    topicId: dayPlan.topicId,
    round: dayPlan.round,
  };

  switch (blockId) {
    case "shadowing":
      return { ...base };
    case "reflex":
      return { ...base, phraseCount: dayPlan.phraseCount ?? 12 };
    case "picture_talk":
      return { ...base, imageSetId: dayPlan.imageSetId };
    case "speaking":
      return { ...base, scenarioId: dayPlan.scenarioId };
    case "chunks":
      return { ...base, chunkKeys: dayPlan.chunkKeys ?? [] };
    case "voice_diary":
      return { ...base };
  }
}
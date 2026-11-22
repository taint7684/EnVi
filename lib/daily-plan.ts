export type BlockId =
  | "warmup"
  | "makeup"
  | "reflex"
  | "speaking"
  | "fluency"
  | "srs"
  | "listen"
  | "vocab_new"
  | "pronunciation"
  | "rotate";

export const BLOCK_DEFS: Record<
  BlockId,
  { label: string; min: number; ideal: number; max: number; speaking: boolean }
> = {
  warmup: { label: "Khởi động (đọc to cụm)", min: 3, ideal: 5, max: 5, speaking: true },
  makeup: { label: "Bài bù", min: 5, ideal: 5, max: 10, speaking: true },
  reflex: { label: "Reflex", min: 5, ideal: 10, max: 20, speaking: true },
  speaking: { label: "Speaking Coach / Mission", min: 10, ideal: 20, max: 40, speaking: true },
  fluency: { label: "Fluency Drill", min: 0, ideal: 5, max: 10, speaking: true },
  srs: { label: "Ôn SRS đến hạn", min: 5, ideal: 10, max: 30, speaking: false },
  listen: { label: "Nghe & Shadowing", min: 5, ideal: 10, max: 20, speaking: false },
  vocab_new: { label: "Từ mới (Triage + học)", min: 0, ideal: 5, max: 30, speaking: false },
  pronunciation: { label: "Phát âm tuần", min: 0, ideal: 5, max: 10, speaking: true },
  rotate: { label: "Đictation / Đọc / Ngữ pháp / Viết (xoay vòng)", min: 0, ideal: 5, max: 15, speaking: false },
};

export const ORDER: BlockId[] = [
  "warmup",
  "makeup",
  "reflex",
  "speaking",
  "fluency",
  "srs",
  "listen",
  "vocab_new",
  "pronunciation",
  "rotate",
];

export function blockLabel(id: BlockId): string {
  return BLOCK_DEFS[id]?.label ?? id;
}

export function allocateBlocks(budget: number): Array<{
  id: BlockId;
  minutes: number;
  min: number;
  ideal: number;
  max: number;
  speaking: boolean;
}> {
  const blocks = ORDER.map((id) => ({
    id,
    minutes: BLOCK_DEFS[id].min,
    min: BLOCK_DEFS[id].min,
    ideal: BLOCK_DEFS[id].ideal,
    max: BLOCK_DEFS[id].max,
    speaking: BLOCK_DEFS[id].speaking,
  }));

  let remaining = budget - blocks.reduce((s, b) => s + b.minutes, 0);
  if (remaining < 0) {
    const kept: typeof blocks = [];
    let acc = 0;
    for (const b of blocks) {
      if (acc + b.min > budget) break;
      kept.push({ ...b, minutes: b.min });
      acc += b.min;
    }
    blocks.length = 0;
    blocks.push(...kept);
    remaining = budget - acc;
  }

  for (const b of blocks) {
    if (remaining <= 0) break;
    const add = Math.min(remaining, b.ideal - b.minutes);
    b.minutes += add;
    remaining -= add;
  }
  for (const b of blocks) {
    if (remaining <= 0) break;
    const add = Math.min(remaining, b.max - b.minutes);
    b.minutes += add;
    remaining -= add;
  }

  const speakingSum = blocks
    .filter((b) => b.speaking)
    .reduce((s, b) => s + b.minutes, 0);
  const targetSpeaking = Math.ceil(budget * 0.5);
  if (speakingSum < targetSpeaking) {
    let need = targetSpeaking - speakingSum;
    for (const b of blocks) {
      if (need <= 0) break;
      if (!b.speaking) {
        const cut = Math.min(need, b.minutes - b.min);
        b.minutes -= cut;
        need -= cut;
      }
    }
  }

  return blocks.filter((b) => b.minutes > 0);
}

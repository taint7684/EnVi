import type { Json } from "./types";

export type CurriculumPhase = "G1" | "G2" | "G3" | "G4" | "G5";

export type CurriculumLayer = "L1" | "L2" | "L3";

export type CurriculumTopic = {
  id: string;
  round: 1 | 2;
  order: number;
  nameVi: string;
  nameEn: string;
  focusLife: string;
  focusWork: string;
};

export type LayerContent = {
  topicId: string;
  layer: CurriculumLayer;
  weightPct: number;
  description: string;
  starterChunks: string[];
  starterOpeners: string[];
};

export type WeekPlan = {
  weekNum: number;
  topicId: string;
  round: 1 | 2;
  phase: CurriculumPhase;
  layerWeights: Record<CurriculumLayer, number>;
  workTopicPct: number;
  startDay: number;
  endDay: number;
};

export type UserStats = {
  currentDay: number;
  currentWeek: number;
  currentPhase: CurriculumPhase;
  baselineLatencyMs: number | null;
  baselineWpm: number | null;
  totalSpeakingMinutes: number;
  streakDays: number;
};

export type DayBlock = {
  id: string;
  label: string;
  minutes: number;
  speaking: boolean;
  module: "reflex" | "speaking" | "picture_talk" | "shadowing" | "chunks" | "voice_diary" | "mirror" | "real_world" | "dashboard";
  config: {
    layer?: CurriculumLayer;
    topicId?: string;
    round?: 1 | 2;
    phraseCount?: number;
    imageSetId?: string;
    scenarioId?: string;
    chunkKeys?: string[];
  };
};

export type DayPlan = {
  dayIndex: number;
  weekNum: number;
  phase: CurriculumPhase;
  topicId: string;
  topicNameVi: string;
  topicNameEn: string;
  layerWeights: Record<CurriculumLayer, number>;
  workTopicPct: number;
  blocks: DayBlock[];
  totalMinutes: number;
  speakingMinutes: number;
  speakingPct: number;
  xpTarget: number;
};

const PHASE_RANGES: Record<CurriculumPhase, [number, number]> = {
  G1: [1, 30],
  G2: [31, 60],
  G3: [61, 90],
  G4: [91, 135],
  G5: [136, 180],
};

const WEEK_PLANS: WeekPlan[] = [
  { weekNum: 1, topicId: "topic-01-self", round: 1, phase: "G1", layerWeights: { L1: 70, L2: 30, L3: 0 }, workTopicPct: 10, startDay: 1, endDay: 7 },
  { weekNum: 2, topicId: "topic-02-family", round: 1, phase: "G1", layerWeights: { L1: 70, L2: 30, L3: 0 }, workTopicPct: 10, startDay: 8, endDay: 14 },
  { weekNum: 3, topicId: "topic-03-friends", round: 1, phase: "G1", layerWeights: { L1: 70, L2: 30, L3: 0 }, workTopicPct: 10, startDay: 15, endDay: 21 },
  { weekNum: 4, topicId: "topic-04-work-daily", round: 1, phase: "G1", layerWeights: { L1: 70, L2: 30, L3: 0 }, workTopicPct: 10, startDay: 22, endDay: 28 },
  { weekNum: 5, topicId: "topic-05-hobbies", round: 1, phase: "G1", layerWeights: { L1: 70, L2: 30, L3: 0 }, workTopicPct: 10, startDay: 29, endDay: 35 },
  { weekNum: 6, topicId: "topic-06-food", round: 1, phase: "G2", layerWeights: { L1: 40, L2: 50, L3: 10 }, workTopicPct: 10, startDay: 36, endDay: 42 },
  { weekNum: 7, topicId: "topic-07-home", round: 1, phase: "G2", layerWeights: { L1: 40, L2: 50, L3: 10 }, workTopicPct: 10, startDay: 43, endDay: 49 },
  { weekNum: 8, topicId: "topic-08-love", round: 1, phase: "G2", layerWeights: { L1: 40, L2: 50, L3: 10 }, workTopicPct: 10, startDay: 50, endDay: 56 },
  { weekNum: 9, topicId: "topic-09-health", round: 1, phase: "G2", layerWeights: { L1: 40, L2: 50, L3: 10 }, workTopicPct: 15, startDay: 57, endDay: 63 },
  { weekNum: 10, topicId: "topic-10-travel", round: 1, phase: "G3", layerWeights: { L1: 20, L2: 50, L3: 30 }, workTopicPct: 15, startDay: 64, endDay: 70 },
  { weekNum: 11, topicId: "topic-11-money", round: 1, phase: "G3", layerWeights: { L1: 20, L2: 50, L3: 30 }, workTopicPct: 15, startDay: 71, endDay: 77 },
  { weekNum: 12, topicId: "topic-12-tech", round: 1, phase: "G3", layerWeights: { L1: 20, L2: 50, L3: 30 }, workTopicPct: 15, startDay: 78, endDay: 84 },
  { weekNum: 13, topicId: "topic-13-dreams", round: 1, phase: "G3", layerWeights: { L1: 20, L2: 50, L3: 30 }, workTopicPct: 15, startDay: 85, endDay: 91 },
  { weekNum: 14, topicId: "topic-01-self-r2", round: 2, phase: "G4", layerWeights: { L1: 10, L2: 40, L3: 50 }, workTopicPct: 30, startDay: 92, endDay: 98 },
  { weekNum: 15, topicId: "topic-02-family-r2", round: 2, phase: "G4", layerWeights: { L1: 10, L2: 40, L3: 50 }, workTopicPct: 30, startDay: 99, endDay: 105 },
  { weekNum: 16, topicId: "topic-03-friends-r2", round: 2, phase: "G4", layerWeights: { L1: 10, L2: 40, L3: 50 }, workTopicPct: 30, startDay: 106, endDay: 112 },
  { weekNum: 17, topicId: "topic-04-work-daily-r2", round: 2, phase: "G4", layerWeights: { L1: 10, L2: 40, L3: 50 }, workTopicPct: 30, startDay: 113, endDay: 119 },
  { weekNum: 18, topicId: "topic-05-hobbies-r2", round: 2, phase: "G4", layerWeights: { L1: 10, L2: 40, L3: 50 }, workTopicPct: 30, startDay: 120, endDay: 126 },
  { weekNum: 19, topicId: "topic-06-food-r2", round: 2, phase: "G4", layerWeights: { L1: 10, L2: 40, L3: 50 }, workTopicPct: 30, startDay: 127, endDay: 133 },
  { weekNum: 20, topicId: "topic-07-home-r2", round: 2, phase: "G5", layerWeights: { L1: 0, L2: 30, L3: 70 }, workTopicPct: 40, startDay: 134, endDay: 140 },
  { weekNum: 21, topicId: "topic-08-love-r2", round: 2, phase: "G5", layerWeights: { L1: 0, L2: 30, L3: 70 }, workTopicPct: 40, startDay: 141, endDay: 147 },
  { weekNum: 22, topicId: "topic-09-health-r2", round: 2, phase: "G5", layerWeights: { L1: 0, L2: 30, L3: 70 }, workTopicPct: 40, startDay: 148, endDay: 154 },
  { weekNum: 23, topicId: "topic-10-travel-r2", round: 2, phase: "G5", layerWeights: { L1: 0, L2: 30, L3: 70 }, workTopicPct: 40, startDay: 155, endDay: 161 },
  { weekNum: 24, topicId: "topic-11-money-r2", round: 2, phase: "G5", layerWeights: { L1: 0, L2: 30, L3: 70 }, workTopicPct: 40, startDay: 162, endDay: 168 },
  { weekNum: 25, topicId: "topic-12-tech-r2", round: 2, phase: "G5", layerWeights: { L1: 0, L2: 30, L3: 70 }, workTopicPct: 40, startDay: 169, endDay: 175 },
  { weekNum: 26, topicId: "topic-13-dreams-r2", round: 2, phase: "G5", layerWeights: { L1: 0, L2: 30, L3: 70 }, workTopicPct: 40, startDay: 176, endDay: 180 },
];

const TOPIC_NAMES: Record<string, { vi: string; en: string }> = {
  "topic-01-self": { vi: "Bản thân & Routine", en: "Self & Routine" },
  "topic-02-family": { vi: "Gia đình", en: "Family" },
  "topic-03-friends": { vi: "Bạn bè & Giao tiếp", en: "Friends & Communication" },
  "topic-04-work-daily": { vi: "Công việc hằng ngày", en: "Daily Work" },
  "topic-05-hobbies": { vi: "Sở thích & Thời gian rảnh", en: "Hobbies & Free Time" },
  "topic-06-food": { vi: "Đồ ăn & Nấu ăn", en: "Food & Cooking" },
  "topic-07-home": { vi: "Nhà cửa & Nơi sống", en: "Home & Living" },
  "topic-08-love": { vi: "Love & Quan hệ", en: "Love & Relationships" },
  "topic-09-health": { vi: "Sức khỏe & Cảm xúc", en: "Health & Emotions" },
  "topic-10-travel": { vi: "Du lịch", en: "Travel" },
  "topic-11-money": { vi: "Tiền & Mua sắm", en: "Money & Shopping" },
  "topic-12-tech": { vi: "Công nghệ & Điện thoại", en: "Tech & Phone" },
  "topic-13-dreams": { vi: "Kế hoạch & Ước mơ", en: "Plans & Dreams" },
  "topic-01-self-r2": { vi: "Bản thân & Routine (Nâng cao)", en: "Self & Routine (Advanced)" },
  "topic-02-family-r2": { vi: "Gia đình (Nâng cao)", en: "Family (Advanced)" },
  "topic-03-friends-r2": { vi: "Bạn bè & Networking", en: "Friends & Networking" },
  "topic-04-work-daily-r2": { vi: "Công việc chuyên sâu", en: "Advanced Work" },
  "topic-05-hobbies-r2": { vi: "Sở thích chuyên nghiệp", en: "Professional Hobbies" },
  "topic-06-food-r2": { vi: "Đồ ăn văn hóa", en: "Food Culture" },
  "topic-07-home-r2": { vi: "Không gian làm việc", en: "Workspace" },
  "topic-08-love-r2": { vi: "Quan hệ lâu dài", en: "Long-term Relationships" },
  "topic-09-health-r2": { vi: "Sức khỏe bền vững", en: "Sustainable Health" },
  "topic-10-travel-r2": { vi: "Du lịch công việc", en: "Business Travel" },
  "topic-11-money-r2": { vi: "Tài chính cá nhân", en: "Personal Finance" },
  "topic-12-tech-r2": { vi: "Công nghệ nâng cao", en: "Advanced Tech" },
  "topic-13-dreams-r2": { vi: "Kế hoạch 5 năm", en: "5-Year Plan" },
};

const LAYER_DESCRIPTIONS: Record<CurriculumLayer, string> = {
  L1: "Describe / Answer (Hiện tại đơn, thói quen, thích/không thích)",
  L2: "Story / Experience (Quá khứ, kế hoạch, so sánh, kể chuyện)",
  L3: "Opinion / Argument (Ý kiến, lập luận, giả định, quan điểm)",
};

const BLOCK_MINUTES = {
  shadowing: 10,
  reflex: 20,
  picture_talk: 15,
  speaking: 30,
  chunks: 10,
  voice_diary: 5,
} as const;

const TOTAL_MINUTES = Object.values(BLOCK_MINUTES).reduce((a, b) => a + b, 0);

const SPEAKING_MINUTES = BLOCK_MINUTES.shadowing + BLOCK_MINUTES.reflex + BLOCK_MINUTES.picture_talk + BLOCK_MINUTES.speaking + BLOCK_MINUTES.chunks + BLOCK_MINUTES.voice_diary;

function getPhase(dayIndex: number): CurriculumPhase {
  if (dayIndex <= 30) return "G1";
  if (dayIndex <= 60) return "G2";
  if (dayIndex <= 90) return "G3";
  if (dayIndex <= 135) return "G4";
  return "G5";
}

function getWeekPlan(dayIndex: number): WeekPlan {
  const clamped = Math.max(1, Math.min(180, dayIndex));
  const week = WEEK_PLANS.find((w) => clamped >= w.startDay && clamped <= w.endDay);
  return week ?? WEEK_PLANS[0]!;
}

function getLayerForDay(dayIndex: number, layerWeights: Record<CurriculumLayer, number>): CurriculumLayer {
  const dayOfWeek = ((dayIndex - 1) % 7) + 1;
  const rand = ((dayIndex * 7 + dayOfWeek * 13) % 100) + 1;
  let cum = 0;
  for (const [layer, weight] of Object.entries(layerWeights) as [CurriculumLayer, number][]) {
    cum += weight;
    if (rand <= cum) return layer;
  }
  return "L1";
}

function getChunkKeysForLayer(layer: CurriculumLayer, workTopicPct: number): string[] {
  const baseChunks: Record<CurriculumLayer, string[]> = {
    L1: ["daily_routine", "wake_up", "work_habits", "free_time", "hobby_list", "relax_way", "favorite_food", "cook_skill", "eat_out", "home_type", "room_favorite", "neighborhood"],
    L2: ["past_routine", "changed_habit", "future_plan", "childhood_memory", "family_change", "family_tradition", "project_story", "work_challenge", "lesson_learned", "memorable_meal", "cooking_fail", "food_adventure"],
    L3: ["balance_opinion", "routine_philosophy", "modern_family", "elderly_care", "productivity_view", "meeting_culture", "healthy_eating", "food_ethics", "urban_vs_rural", "remote_work_future"],
  };
  const chunks = [...baseChunks[layer]];
  if (workTopicPct >= 30) {
    const workChunks: Record<CurriculumLayer, string[]> = {
      L1: ["ba_daily_flow", "deep_work_block", "standup_routine", "sprint_planning", "retro_format", "estimation_poker"],
      L2: ["tough_project", "stakeholder_conflict", "technical_decision", "vague_requirement", "scope_creep", "priority_conflict"],
      L3: ["meeting_load", "focus_time_defense", "async_first", "standup_necessity", "retro_actionable", "estimation_accuracy"],
    };
    chunks.push(...workChunks[layer]);
  }
  return chunks;
}

function getImageSetForTopic(topicId: string, layer: CurriculumLayer): string {
  const base = topicId.replace("-r2", "").replace("topic-", "");
  return `pic-${base}-${layer.toLowerCase()}`;
}

function getScenarioForTopic(topicId: string, layer: CurriculumLayer, round: 1 | 2): string {
  const base = topicId.replace("-r2", "").replace("topic-", "");
  return `speak-${round}-${base}-${layer.toLowerCase()}`;
}

export function getDayPlan(dayIndex: number, userStats: UserStats): DayPlan {
  const clampedDay = Math.max(1, Math.min(180, dayIndex));
  const weekPlan = getWeekPlan(clampedDay);
  const phase = getPhase(clampedDay);
  const layer = getLayerForDay(clampedDay, weekPlan.layerWeights);
  const topicNames = TOPIC_NAMES[weekPlan.topicId] ?? { vi: weekPlan.topicId, en: weekPlan.topicId };
  const chunkKeys = getChunkKeysForLayer(layer, weekPlan.workTopicPct);
  const imageSetId = getImageSetForTopic(weekPlan.topicId, layer);
  const scenarioId = getScenarioForTopic(weekPlan.topicId, layer, weekPlan.round);

  const blocks: DayBlock[] = [
    {
      id: "shadowing",
      label: "Shadowing (nghe & lặp)",
      minutes: BLOCK_MINUTES.shadowing,
      speaking: true,
      module: "shadowing",
      config: {
        layer,
        topicId: weekPlan.topicId,
        round: weekPlan.round,
      },
    },
    {
      id: "reflex",
      label: "Reflex (câu phản xạ)",
      minutes: BLOCK_MINUTES.reflex,
      speaking: true,
      module: "reflex",
      config: {
        layer,
        topicId: weekPlan.topicId,
        round: weekPlan.round,
        phraseCount: 12,
      },
    },
    {
      id: "picture_talk",
      label: "Picture Talk (mô tả ảnh)",
      minutes: BLOCK_MINUTES.picture_talk,
      speaking: true,
      module: "picture_talk",
      config: {
        layer,
        topicId: weekPlan.topicId,
        round: weekPlan.round,
        imageSetId,
      },
    },
    {
      id: "speaking",
      label: "AI Speaking (trò chuyện tự do)",
      minutes: BLOCK_MINUTES.speaking,
      speaking: true,
      module: "speaking",
      config: {
        layer,
        topicId: weekPlan.topicId,
        round: weekPlan.round,
        scenarioId,
      },
    },
    {
      id: "chunks",
      label: "Chunks (cụm từ sẵn sàng)",
      minutes: BLOCK_MINUTES.chunks,
      speaking: true,
      module: "chunks",
      config: {
        layer,
        topicId: weekPlan.topicId,
        round: weekPlan.round,
        chunkKeys: chunkKeys.slice(0, 5),
      },
    },
    {
      id: "voice_diary",
      label: "Voice Diary (nhật ký giọng)",
      minutes: BLOCK_MINUTES.voice_diary,
      speaking: true,
      module: "voice_diary",
      config: {
        layer,
        topicId: weekPlan.topicId,
        round: weekPlan.round,
      },
    },
  ];

  const totalMinutes = blocks.reduce((sum, b) => sum + b.minutes, 0);
  const speakingMinutes = blocks.filter((b) => b.speaking).reduce((sum, b) => sum + b.minutes, 0);

  return {
    dayIndex: clampedDay,
    weekNum: weekPlan.weekNum,
    phase,
    topicId: weekPlan.topicId,
    topicNameVi: topicNames.vi,
    topicNameEn: topicNames.en,
    layerWeights: weekPlan.layerWeights,
    workTopicPct: weekPlan.workTopicPct,
    blocks,
    totalMinutes,
    speakingMinutes,
    speakingPct: Math.round((speakingMinutes / totalMinutes) * 100),
    xpTarget: speakingMinutes * 6, // +1 XP per 10s speaking = 6 XP per minute
  };
}

export function getPhaseFromDay(dayIndex: number): CurriculumPhase {
  return getPhase(dayIndex);
}

export function getWeekNumFromDay(dayIndex: number): number {
  return Math.ceil(Math.max(1, Math.min(180, dayIndex)) / 7);
}

export function getTopicForDay(dayIndex: number): { topicId: string; round: 1 | 2 } {
  const weekPlan = getWeekPlan(dayIndex);
  return { topicId: weekPlan.topicId, round: weekPlan.round };
}

export function getLayerWeightsForPhase(phase: CurriculumPhase): Record<CurriculumLayer, number> {
  const week = WEEK_PLANS.find((w) => w.phase === phase);
  return week?.layerWeights ?? { L1: 70, L2: 30, L3: 0 };
}

export function getAllWeekPlans(): WeekPlan[] {
  return [...WEEK_PLANS];
}

export function getTopicName(topicId: string): { vi: string; en: string } {
  return TOPIC_NAMES[topicId] ?? { vi: topicId, en: topicId };
}

export function getLayerDescription(layer: CurriculumLayer): string {
  return LAYER_DESCRIPTIONS[layer];
}
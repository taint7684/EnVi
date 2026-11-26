import { getDayPlan, type DayPlan, type DayBlock, type UserStats, type CurriculumPhase } from "./curriculum";

export type TodayMode = "normal" | "busy" | "saturday" | "sunday";

export type TodayPlan = DayPlan & {
  mode: TodayMode;
  isWeekend: boolean;
  dayOfWeek: number;
  encouragement: string;
};

export { type DayBlock } from "./curriculum";

const ENCOURAGEMENTS = [
  "Hôm nay bạn sẽ nói tiếng Anh tự tin hơn hôm qua.",
  "Mỗi câu bạn nói là một bước tiến. Cứ mở miệng ra thôi.",
  "Đừng lo sai — nói được là thắng. Bắt đầu nào!",
  "30 phút hôm nay = 1% trôi chảy hơn. Sẵn sàng chưa?",
  "Giọng bạn hôm nay nghe sẽ tự nhiên hơn. Thử ngay!",
];

const BUSY_BLOCKS: DayBlock[] = [
  {
    id: "reflex",
    label: "Reflex nhanh",
    minutes: 7,
    speaking: true,
    module: "reflex",
    config: { phraseCount: 6 },
  },
  {
    id: "picture_talk",
    label: "Picture Talk nhanh",
    minutes: 5,
    speaking: true,
    module: "picture_talk",
    config: {},
  },
  {
    id: "voice_diary",
    label: "Voice Diary",
    minutes: 3,
    speaking: true,
    module: "voice_diary",
    config: {},
  },
];

const SATURDAY_BLOCKS: DayBlock[] = [
  {
    id: "reflex_review",
    label: "Ôn Reflex câu yếu",
    minutes: 10,
    speaking: true,
    module: "reflex",
    config: { phraseCount: 10 },
  },
  {
    id: "real_world",
    label: "Nhiệm vụ thực tế",
    minutes: 20,
    speaking: true,
    module: "real_world",
    config: {},
  },
  {
    id: "voice_diary",
    label: "Voice Diary",
    minutes: 5,
    speaking: true,
    module: "voice_diary",
    config: {},
  },
];

const SUNDAY_BLOCKS: DayBlock[] = [
  {
    id: "mirror",
    label: "Mirror Recording (Trước/Sau)",
    minutes: 15,
    speaking: true,
    module: "mirror",
    config: {},
  },
  {
    id: "weekly_review",
    label: "Xem lại tuần & Dashboard",
    minutes: 10,
    speaking: false,
    module: "dashboard",
    config: {},
  },
  {
    id: "voice_diary",
    label: "Voice Diary nhẹ nhàng",
    minutes: 5,
    speaking: true,
    module: "voice_diary",
    config: {},
  },
];

function getMode(dayIndex: number, userMode?: TodayMode): TodayMode {
  if (userMode) return userMode;
  const dayOfWeek = ((dayIndex - 1) % 7) + 1;
  if (dayOfWeek === 6) return "saturday";
  if (dayOfWeek === 0 || dayOfWeek === 7) return "sunday";
  return "normal";
}

function getEncouragement(dayIndex: number, stats: UserStats): string {
  const idx = (dayIndex + stats.streakDays) % ENCOURAGEMENTS.length;
  let msg = ENCOURAGEMENTS[idx];
  if (stats.baselineLatencyMs && stats.baselineLatencyMs > 3000) {
    msg += " Hãy tập mở miệng trước 2 giây nhé!";
  }
  return msg;
}

export function getTodayPlan(dayIndex: number, userStats: UserStats, modeOverride?: TodayMode): TodayPlan {
  const mode = getMode(dayIndex, modeOverride);
  const dayOfWeek = ((dayIndex - 1) % 7) + 1;
  const isWeekend = dayOfWeek === 6 || dayOfWeek === 0 || dayOfWeek === 7;

  let basePlan: DayPlan;
  let blocks: DayBlock[];

  switch (mode) {
    case "busy":
      basePlan = getDayPlan(dayIndex, userStats);
      blocks = BUSY_BLOCKS.map((b, i) => ({
        ...b,
        config: { ...b.config, ...basePlan.blocks[i]?.config },
      }));
      break;
    case "saturday":
      basePlan = getDayPlan(dayIndex, userStats);
      blocks = SATURDAY_BLOCKS.map((b, i) => ({
        ...b,
        config: { ...b.config, ...basePlan.blocks[i]?.config, topicId: basePlan.topicId, round: basePlan.blocks[i]?.config.round },
      }));
      break;
    case "sunday":
      basePlan = getDayPlan(dayIndex, userStats);
      blocks = SUNDAY_BLOCKS;
      break;
    default:
      basePlan = getDayPlan(dayIndex, userStats);
      blocks = basePlan.blocks;
  }

  const totalMinutes = blocks.reduce((sum, b) => sum + b.minutes, 0);
  const speakingMinutes = blocks.filter((b) => b.speaking).reduce((sum, b) => sum + b.minutes, 0);

  return {
    ...basePlan,
    mode,
    isWeekend,
    dayOfWeek,
    blocks,
    totalMinutes,
    speakingMinutes,
    speakingPct: Math.round((speakingMinutes / totalMinutes) * 100),
    xpTarget: speakingMinutes * 6,
    encouragement: getEncouragement(dayIndex, userStats),
  };
}

export function getPhaseLabel(phase: CurriculumPhase): string {
  const labels: Record<CurriculumPhase, string> = {
    G1: "G1 — Phá băng (Ngày 1–30)",
    G2: "G2 — Mở rộng (Ngày 31–60)",
    G3: "G3 — Trôi chảy B1 (Ngày 61–90)",
    G4: "G4 — Bước vào B2 (Ngày 91–135)",
    G5: "G5 — Vững B2 (Ngày 136–180)",
  };
  return labels[phase];
}

export function getModeLabel(mode: TodayMode): string {
  const labels: Record<TodayMode, string> = {
    normal: "Bình thường (90′)",
    busy: "Ngày bận (15′)",
    saturday: "Thứ 7 — Nhiệm vụ thực tế",
    sunday: "Chủ nhật — Mirror & Ôn tập",
  };
  return labels[mode];
}
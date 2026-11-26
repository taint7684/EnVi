import { describe, it, expect } from "vitest";
import {
  getDayPlan,
  getPhaseFromDay,
  getWeekNumFromDay,
  getTopicForDay,
  getLayerWeightsForPhase,
  getAllWeekPlans,
  getTopicName,
  getLayerDescription,
} from "./curriculum";

describe("curriculum.ts - getDayPlan", () => {
  const baseStats = {
    currentDay: 1,
    currentWeek: 1,
    currentPhase: "G1" as const,
    baselineLatencyMs: null,
    baselineWpm: null,
    totalSpeakingMinutes: 0,
    streakDays: 0,
  };

  describe("Phase boundaries", () => {
    it("Day 1 returns G1", () => {
      const plan = getDayPlan(1, baseStats);
      expect(plan.phase).toBe("G1");
      expect(plan.dayIndex).toBe(1);
    });

    it("Day 30 returns G1 (last day of G1)", () => {
      const plan = getDayPlan(30, baseStats);
      expect(plan.phase).toBe("G1");
      expect(plan.dayIndex).toBe(30);
    });

    it("Day 31 returns G2", () => {
      const plan = getDayPlan(31, baseStats);
      expect(plan.phase).toBe("G2");
      expect(plan.dayIndex).toBe(31);
    });

    it("Day 60 returns G2 (last day of G2)", () => {
      const plan = getDayPlan(60, baseStats);
      expect(plan.phase).toBe("G2");
      expect(plan.dayIndex).toBe(60);
    });

    it("Day 61 returns G3", () => {
      const plan = getDayPlan(61, baseStats);
      expect(plan.phase).toBe("G3");
      expect(plan.dayIndex).toBe(61);
    });

    it("Day 90 returns G3 (last day of G3)", () => {
      const plan = getDayPlan(90, baseStats);
      expect(plan.phase).toBe("G3");
      expect(plan.dayIndex).toBe(90);
    });

    it("Day 91 returns G4", () => {
      const plan = getDayPlan(91, baseStats);
      expect(plan.phase).toBe("G4");
      expect(plan.dayIndex).toBe(91);
    });

    it("Day 135 returns G4 (last day of G4)", () => {
      const plan = getDayPlan(135, baseStats);
      expect(plan.phase).toBe("G4");
      expect(plan.dayIndex).toBe(135);
    });

    it("Day 136 returns G5", () => {
      const plan = getDayPlan(136, baseStats);
      expect(plan.phase).toBe("G5");
      expect(plan.dayIndex).toBe(136);
    });

    it("Day 180 returns G5 (last day)", () => {
      const plan = getDayPlan(180, baseStats);
      expect(plan.phase).toBe("G5");
      expect(plan.dayIndex).toBe(180);
    });
  });

  describe("Week mapping", () => {
    it("Day 1 is week 1", () => {
      const plan = getDayPlan(1, baseStats);
      expect(plan.weekNum).toBe(1);
    });

    it("Day 7 is week 1", () => {
      const plan = getDayPlan(7, baseStats);
      expect(plan.weekNum).toBe(1);
    });

    it("Day 8 is week 2", () => {
      const plan = getDayPlan(8, baseStats);
      expect(plan.weekNum).toBe(2);
    });

    it("Day 91 is week 13 (last week of Round 1)", () => {
      const plan = getDayPlan(91, baseStats);
      expect(plan.weekNum).toBe(13);
    });

    it("Day 92 is week 14 (Round 2 starts)", () => {
      const plan = getDayPlan(92, baseStats);
      expect(plan.weekNum).toBe(14);
    });

    it("Day 180 is week 26", () => {
      const plan = getDayPlan(180, baseStats);
      expect(plan.weekNum).toBe(26);
    });
  });

  describe("Topic progression", () => {
    it("Week 1 (Day 1-7) is topic-01-self Round 1", () => {
      const plan = getDayPlan(1, baseStats);
      expect(plan.topicId).toBe("topic-01-self");
      expect(plan.topicNameVi).toBe("Bản thân & Routine");
      expect(plan.topicNameEn).toBe("Self & Routine");
    });

    it("Week 6 (Day 36-42) is topic-06-food Round 1", () => {
      const plan = getDayPlan(36, baseStats);
      expect(plan.topicId).toBe("topic-06-food");
      expect(plan.topicNameVi).toBe("Đồ ăn & Nấu ăn");
    });

    it("Week 13 (Day 85-91) is topic-13-dreams Round 1", () => {
      const plan = getDayPlan(85, baseStats);
      expect(plan.topicId).toBe("topic-13-dreams");
      expect(plan.topicNameVi).toBe("Kế hoạch & Ước mơ");
    });

    it("Week 14 (Day 92-98) is topic-01-self-r2 Round 2", () => {
      const plan = getDayPlan(92, baseStats);
      expect(plan.topicId).toBe("topic-01-self-r2");
      expect(plan.topicNameVi).toBe("Bản thân & Routine (Nâng cao)");
    });

    it("Week 26 (Day 176-180) is topic-13-dreams-r2 Round 2", () => {
      const plan = getDayPlan(180, baseStats);
      expect(plan.topicId).toBe("topic-13-dreams-r2");
      expect(plan.topicNameVi).toBe("Kế hoạch 5 năm");
    });
  });

  describe("Layer weights by phase", () => {
    it("G1 has L1=70, L2=30, L3=0", () => {
      const plan = getDayPlan(1, baseStats);
      expect(plan.layerWeights.L1).toBe(70);
      expect(plan.layerWeights.L2).toBe(30);
      expect(plan.layerWeights.L3).toBe(0);
    });

    it("G2 has L1=40, L2=50, L3=10", () => {
      const plan = getDayPlan(36, baseStats);
      expect(plan.layerWeights.L1).toBe(40);
      expect(plan.layerWeights.L2).toBe(50);
      expect(plan.layerWeights.L3).toBe(10);
    });

    it("G3 has L1=20, L2=50, L3=30", () => {
      const plan = getDayPlan(64, baseStats);
      expect(plan.layerWeights.L1).toBe(20);
      expect(plan.layerWeights.L2).toBe(50);
      expect(plan.layerWeights.L3).toBe(30);
    });

    it("G4 has L1=10, L2=40, L3=50", () => {
      const plan = getDayPlan(92, baseStats);
      expect(plan.layerWeights.L1).toBe(10);
      expect(plan.layerWeights.L2).toBe(40);
      expect(plan.layerWeights.L3).toBe(50);
    });

    it("G5 has L1=0, L2=30, L3=70", () => {
      const plan = getDayPlan(136, baseStats);
      expect(plan.layerWeights.L1).toBe(0);
      expect(plan.layerWeights.L2).toBe(30);
      expect(plan.layerWeights.L3).toBe(70);
    });
  });

  describe("Work topic percentage", () => {
    it("G1-G2 have 10-15% work topic", () => {
      const plan1 = getDayPlan(1, baseStats);
      expect(plan1.workTopicPct).toBe(10);

      const plan2 = getDayPlan(57, baseStats);
      expect(plan2.workTopicPct).toBe(15);
    });

    it("G3 has 15% work topic", () => {
      const plan = getDayPlan(64, baseStats);
      expect(plan.workTopicPct).toBe(15);
    });

    it("G4 has 30% work topic", () => {
      const plan = getDayPlan(92, baseStats);
      expect(plan.workTopicPct).toBe(30);
    });

    it("G5 has 40% work topic", () => {
      const plan = getDayPlan(136, baseStats);
      expect(plan.workTopicPct).toBe(40);
    });
  });

  describe("Fixed 6 blocks structure", () => {
    it("Always returns exactly 6 blocks", () => {
      for (const day of [1, 30, 31, 60, 61, 90, 91, 135, 136, 180]) {
        const plan = getDayPlan(day, baseStats);
        expect(plan.blocks).toHaveLength(6);
      }
    });

    it("Blocks are in correct order: shadowing, reflex, picture_talk, speaking, chunks, voice_diary", () => {
      const plan = getDayPlan(1, baseStats);
      const ids = plan.blocks.map((b) => b.id);
      expect(ids).toEqual(["shadowing", "reflex", "picture_talk", "speaking", "chunks", "voice_diary"]);
    });

    it("Each block has correct minutes", () => {
      const plan = getDayPlan(1, baseStats);
      const minutes = plan.blocks.map((b) => b.minutes);
      expect(minutes).toEqual([10, 20, 15, 30, 10, 5]);
    });

    it("All blocks are speaking=true", () => {
      const plan = getDayPlan(1, baseStats);
      expect(plan.blocks.every((b) => b.speaking)).toBe(true);
    });

    it("Total minutes = 90", () => {
      const plan = getDayPlan(1, baseStats);
      expect(plan.totalMinutes).toBe(90);
    });

    it("Speaking minutes = 90 (100%)", () => {
      const plan = getDayPlan(1, baseStats);
      expect(plan.speakingMinutes).toBe(90);
      expect(plan.speakingPct).toBe(100);
    });

    it("XP target = speakingMinutes * 6", () => {
      const plan = getDayPlan(1, baseStats);
      expect(plan.xpTarget).toBe(540); // 90 * 6
    });
  });

  describe("Block configs contain layer/topic/round", () => {
    it("Shadowing block has layer, topicId, round", () => {
      const plan = getDayPlan(1, baseStats);
      const block = plan.blocks.find((b) => b.id === "shadowing");
      expect(block?.config.layer).toBeDefined();
      expect(block?.config.topicId).toBe("topic-01-self");
      expect(block?.config.round).toBe(1);
    });

    it("Reflex block has phraseCount=12", () => {
      const plan = getDayPlan(1, baseStats);
      const block = plan.blocks.find((b) => b.id === "reflex");
      expect(block?.config.phraseCount).toBe(12);
    });

    it("Picture Talk block has imageSetId", () => {
      const plan = getDayPlan(1, baseStats);
      const block = plan.blocks.find((b) => b.id === "picture_talk");
      expect(block?.config.imageSetId).toMatch(/^pic-/);
    });

    it("Speaking block has scenarioId", () => {
      const plan = getDayPlan(1, baseStats);
      const block = plan.blocks.find((b) => b.id === "speaking");
      expect(block?.config.scenarioId).toMatch(/^speak-/);
    });

    it("Chunks block has chunkKeys array", () => {
      const plan = getDayPlan(1, baseStats);
      const block = plan.blocks.find((b) => b.id === "chunks");
      expect(Array.isArray(block?.config.chunkKeys)).toBe(true);
      expect((block?.config.chunkKeys ?? []).length).toBeGreaterThan(0);
    });
  });

  describe("Deterministic layer selection", () => {
    it("Same day always returns same layer", () => {
      const plan1 = getDayPlan(1, baseStats);
      const plan2 = getDayPlan(1, baseStats);
      expect(plan1.blocks[0].config.layer).toBe(plan2.blocks[0].config.layer);
    });

    it("Different days in same week can have different layers", () => {
      const layers = new Set<string>();
      for (let day = 1; day <= 7; day++) {
        const plan = getDayPlan(day, baseStats);
        layers.add(plan.blocks[0].config.layer ?? "");
      }
      expect(layers.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Edge cases", () => {
    it("Day 0 clamps to Day 1", () => {
      const plan = getDayPlan(0, baseStats);
      expect(plan.dayIndex).toBe(1);
    });

    it("Day 181 clamps to Day 180", () => {
      const plan = getDayPlan(181, baseStats);
      expect(plan.dayIndex).toBe(180);
    });

    it("Day -5 clamps to Day 1", () => {
      const plan = getDayPlan(-5, baseStats);
      expect(plan.dayIndex).toBe(1);
    });
  });
});

describe("Helper functions", () => {
  describe("getPhaseFromDay", () => {
    it("Returns correct phase for boundaries", () => {
      expect(getPhaseFromDay(1)).toBe("G1");
      expect(getPhaseFromDay(30)).toBe("G1");
      expect(getPhaseFromDay(31)).toBe("G2");
      expect(getPhaseFromDay(60)).toBe("G2");
      expect(getPhaseFromDay(61)).toBe("G3");
      expect(getPhaseFromDay(90)).toBe("G3");
      expect(getPhaseFromDay(91)).toBe("G4");
      expect(getPhaseFromDay(135)).toBe("G4");
      expect(getPhaseFromDay(136)).toBe("G5");
      expect(getPhaseFromDay(180)).toBe("G5");
    });
  });

  describe("getWeekNumFromDay", () => {
    it("Returns correct week numbers", () => {
      expect(getWeekNumFromDay(1)).toBe(1);
      expect(getWeekNumFromDay(7)).toBe(1);
      expect(getWeekNumFromDay(8)).toBe(2);
      expect(getWeekNumFromDay(91)).toBe(13);
      expect(getWeekNumFromDay(92)).toBe(14);
      expect(getWeekNumFromDay(180)).toBe(26);
    });
  });

  describe("getTopicForDay", () => {
    it("Returns topicId and round", () => {
      expect(getTopicForDay(1)).toEqual({ topicId: "topic-01-self", round: 1 });
      expect(getTopicForDay(91)).toEqual({ topicId: "topic-13-dreams", round: 1 });
      expect(getTopicForDay(92)).toEqual({ topicId: "topic-01-self-r2", round: 2 });
    });
  });

  describe("getLayerWeightsForPhase", () => {
    it("Returns correct weights for each phase", () => {
      expect(getLayerWeightsForPhase("G1")).toEqual({ L1: 70, L2: 30, L3: 0 });
      expect(getLayerWeightsForPhase("G2")).toEqual({ L1: 40, L2: 50, L3: 10 });
      expect(getLayerWeightsForPhase("G3")).toEqual({ L1: 20, L2: 50, L3: 30 });
      expect(getLayerWeightsForPhase("G4")).toEqual({ L1: 10, L2: 40, L3: 50 });
      expect(getLayerWeightsForPhase("G5")).toEqual({ L1: 0, L2: 30, L3: 70 });
    });
  });

  describe("getAllWeekPlans", () => {
    it("Returns 26 weeks", () => {
      const weeks = getAllWeekPlans();
      expect(weeks).toHaveLength(26);
    });

    it("Weeks 1-13 are Round 1, 14-26 are Round 2", () => {
      const weeks = getAllWeekPlans();
      expect(weeks.slice(0, 13).every((w) => w.round === 1)).toBe(true);
      expect(weeks.slice(13).every((w) => w.round === 2)).toBe(true);
    });
  });

  describe("getTopicName", () => {
    it("Returns Vietnamese and English names", () => {
      expect(getTopicName("topic-01-self")).toEqual({ vi: "Bản thân & Routine", en: "Self & Routine" });
      expect(getTopicName("topic-13-dreams-r2")).toEqual({ vi: "Kế hoạch 5 năm", en: "5-Year Plan" });
    });

    it("Returns fallback for unknown topic", () => {
      expect(getTopicName("unknown")).toEqual({ vi: "unknown", en: "unknown" });
    });
  });

  describe("getLayerDescription", () => {
    it("Returns description for each layer", () => {
      expect(getLayerDescription("L1")).toContain("Describe / Answer");
      expect(getLayerDescription("L2")).toContain("Story / Experience");
      expect(getLayerDescription("L3")).toContain("Opinion / Argument");
    });
  });
});
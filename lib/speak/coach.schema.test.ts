import { describe, it, expect } from "vitest";
import { CoachFeedbackSchema } from "./schema";

describe("CoachFeedback schema", () => {
  const base = {
    understood: true,
    answered_question: true,
    praise_vi: "Ban noi rat tu nhien.",
    errors: [
      { original: "He go", correction: "He goes", type: "grammar" as const, pattern_key: "third_person_s", explanation_vi: "Them -s cho he/she/it", severity: 2 },
      { original: "I am agree", correction: "I agree", type: "grammar" as const, pattern_key: "am_agree", explanation_vi: "Khong dung am voi agree", severity: 1 },
    ],
    hidden_errors: [],
    natural_version: "He goes to work every day.",
    retry_keywords: ["goes", "work", "day"],
    comprehensibility: 4,
    level_estimate: "A2",
  };

  it("chap nhan feedback hop le (toi da 2 loi)", () => {
    expect(() => CoachFeedbackSchema.parse(base)).not.toThrow();
  });

  it("tuc choi qua 2 loi", () => {
    const bad = { ...base, errors: [...base.errors, { original: "x", correction: "y", type: "vocab" as const, pattern_key: "x", explanation_vi: "z", severity: 1 }] };
    expect(() => CoachFeedbackSchema.parse(bad)).toThrow();
  });

  it("tuc choi thieu truong bat buoc", () => {
    const { praise_vi, ...rest } = base;
    expect(() => CoachFeedbackSchema.parse(rest)).toThrow();
  });
});

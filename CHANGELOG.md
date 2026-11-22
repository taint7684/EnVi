# EnVi — CHANGELOG

## [Unreleased] — S0–S11 theo docs/MASTER_SPEC.md v2.0
- S0: An toàn & nền móng (chi lưu tên bien env trong .env.example; tao docs/MASTER_SPEC.md + PROJECT_MANIFEST.md + DECISIONS.md; them .husky/pre-commit quet secret; groq.ts/whisper.ts lay model tu env).
- S1: Hôm nay / Smart Daily Plan (buildDailyPlan cap phat khoi theo thu tu, >=50% thoi gian noi; luu daily_plans; tu danh dau xong khoi tu activity_events, khong tick tay; ngay ban 15'; bonus ngay idempotent qua daily_summary.bonus_awarded; migrate profile cot moi, mac dinh minutes_per_day=60). Test allocateBlocks (21/21 vitest xanh), tsc/eslint/build xanh.
- S5: Onboarding + Checkpoint + Tien bo - sua loi compile assessment-form (tach import pure tu lib/assessment, saveAssessmentResult tu lib/assessment-db); onboarding form dung onSubmit + state; assessment luu DB (assessment_results, migration 0015) thay localStorage; them /progress (truoc–sau, lich su danh gia) + loading/error; lib/progress summarizeProgress + 5 unit test; nav 5 tab (Hom nay/Noi/Luyen/So loi/Tien bo) thay 14 muc phang; logo -> /today. tsc sach, 29/29 vitest xanh, build xanh.

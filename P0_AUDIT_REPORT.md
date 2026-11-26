# EnVi P0 Audit Report — Current Working Directory

**Date**: 2026-11-26 | **Commit**: HEAD | **Auditor**: Kilo
**Scope**: Full codebase audit against Master Prompt requirements

---

## 1. Module / Route / Table Map

### 1.1 Application Routes (28 routes, `app/(main)/`)
| Route | Feature | Status | Key Issues |
|-------|---------|--------|------------|
| `/` | Home / Dashboard | ✅ | Streak, quick actions |
| `/today` | Daily Plan (North Star) | ✅ | 10 blocks, speaking-first, but 8 blocks not 6 per Master Prompt |
| `/vocab` | Vocabulary SRS | ✅ | FSRS fallback, 20 words/day, triage |
| `/vocab/new` | New Words | ✅ | Group-based, session persistence broken in prod |
| `/vocab/review` | Review Queue | ✅ | FSRS or basic fallback |
| `/speaking` | Speaking AI (5+3 turns) | ⚠️ | Coach/FreeSpeak, retry-blind on turn 2 only |
| `/speaking/home` | Speaking Home | ✅ | AI toggle, topic picker |
| `/reflex` | Reflex Drills | ⚠️ | **Only 50 phrases** (need 1,440), 4 modes, pure default |
| `/reflex/drills` | Reflex Drills (legacy) | ✅ | Separate page, should merge |
| `/picture-talk` | Picture Talk | ⚠️ | **Only 12 image sets** (need 52), 4 levels |
| `/shadowing` | Shadowing | ✅ | 60 lessons, A2→B2 sort |
| `/reading` | Reading Daily | ✅ | 2 passages/day, read-aloud |
| `/listening` | Listening | ✅ | Dictation + segment replay |
| `/pronunciation` | Pronunciation | ✅ | Minimal pairs, waveform |
| `/grammar` | Grammar v2 | ✅ | 16 topics, mindmaps, quiz |
| `/writing` | Writing | ⚠️ | **HIDE per Master Prompt** - AI feedback stub |
| `/real-world` | Real World Tasks | ❌ | Logs only, no weekly generator |
| `/missions` | Missions/Gamification | ⚠️ | Passive XP, not speaking-seconds based |
| `/settings` | Settings | ⚠️ | Feature flags client-only |
| `/assessment` | Assessment | ✅ | Milestone tests (baseline/30/60/90) |
| `/roadmap` | Roadmap | ⚠️ | **90-day only** (need 180-day with 13 topics × 2 rounds) |

### 1.2 Core Data Files
| File | Current Count | Required | Gap |
|------|---------------|----------|-----|
| `data/reflex-phrases.json` | 50 phrases | 1,440 (8/day × 180) | **96.5% missing** |
| `data/picture-talk-images.json` | 12 sets | 52 (13 topics × 4) | **77% missing** |
| `data/words.json` | 5,029 words | 3,000 core + extended flag | **No filter, no placement** |
| `data/speaking-questions-by-level.ts` | 20 topics × 3 levels | Aligned to 13 topics × 2 rounds | **Not curriculum-aligned** |
| `data/missions.json` | 60 missions | Aligned to curriculum | **Not topic/phase aware** |
| Curriculum / Roadmap | 90-day | 180-day spiral (B1+B2 merged) | **Missing entirely** |

### 1.3 Database Schema Status
- **No local migrations** - all managed in Supabase cloud
- **Production gaps** (per audit): `speech_metrics`, `mirror_recordings`, `curriculum_progress`, `vocab_session_state`, `feature_flags`, `reflex_phrases`, `real_world_weekly_tasks`, `placement_test`, 3000-word `extended` flag
- **Tables in use**: `profiles`, `card_reviews`, `phrase_reviews`, `speaking_sessions`, `speaking_turns`, `activity_events`, `daily_progress`, `daily_plans`, `daily_summary`, `vocab_session_state`, `user_word_triage`, `words`, `phrases`

---

## 2. §2 Violations — VI→EN Flows (Master Prompt §2.1)

**Rule**: "Không có tiếng Việt hiển thị trong lúc nói. Mọi kích thích phải là: audio EN, hình ảnh, tình huống EN đơn giản, hoặc câu hỏi EN."

| # | Module | Current Violation | Required Fix |
|---|--------|-------------------|--------------|
| V1 | **Reflex "reflex" mode** | Shows `vi_text` (L1) or `situation_en` with VI fallback | Pure mode only; hide VI behind lifeline button |
| V2 | **Picture Talk** | `titleVi`, `opinion_questions` in VI, lifeline translates VI→EN | All prompts EN only; lifeline logs `lifeline_used` |
| V3 | **Speaking AI Lifeline** | Shows VI hint: "Gợi ý tiếng Việt: Hãy trả lời..." | Remove VI text; log `lifeline_used` only |
| V4 | **Vocab Flashcard** | `meaning_vi` shown by default on back | Hide VI behind button; show EN example first |
| V5 | **Grammar Translation** | VI→EN translation exercises | **HIDE** behind feature flag |
| V6 | **Reading** | VI translations in passages | **HIDE** behind feature flag |
| V7 | **Self-Talk (old)** | VI prompts → speak EN | **REPLACE** with Voice Diary (EN prompts only) |

---

## 3. Missing Core Metrics (Master Prompt §8.1 North Star)

| Metric | Current | Required |
|--------|---------|----------|
| **Onset latency** (Reflex) | ❌ Not measured | **#1 metric** - VAD client-side |
| **WPM** (free speech) | ✅ In `speaking_turns.wpm` | Track per module |
| **Continuous turn length** | ❌ Not measured | Pause >3s detection |
| **VI segments in speech** | ❌ Not measured | Whisper language detect + diacritics |
| **Lifeline used count** | ✅ Logged in Speaking AI | Extend to all modules |
| **Speaking minutes/week** | ✅ North Star | Weight by module |

---

## 4. KEEP / FIX / HIDE Decision Matrix

| Feature | Decision | Rationale |
|---------|----------|-----------|
| **Vocab SRS (FSRS)** | **KEEP** | Core, resilient fallback |
| **Vocab New (20/day)** | **KEEP** | Fix session persistence |
| **Speaking AI (5+3)** | **FIX** | Extend retry-blind to turns 3,5,7,8; FreeTalk default |
| **Reflex Drills** | **FIX** | Expand to 1,440 phrases; pure mode only default |
| **Picture Talk** | **FIX** | Expand to 52 sets; mandatory retry; map 4 levels → 3 layers |
| **Shadowing** | **KEEP** | Add blind retry mode; weekly sentence from curriculum |
| **Reading Daily** | **HIDE** | Behind flag; not speaking-focused |
| **Listening** | **HIDE** | Behind flag; input-only |
| **Pronunciation** | **KEEP** | Minimal pairs; add retry after correction |
| **Grammar v2** | **HIDE** | Behind flag; translation mode removed |
| **Writing** | **HIDE** | Behind flag; not speaking |
| **Real World** | **FIX** | Weekly generator + AI feedback + retry-blind |
| **Missions/XP** | **FIX** | Speaking-seconds based; daily/weekly missions |
| **Streak** | **FIX** | Require ≥3 min speaking/day |
| **Settings** | **FIX** | Server-side feature flags table |
| **Roadmap** | **FIX** | 180-day spiral curriculum |
| **Assessment** | **FIX** | CEFR speaking rubric + objective metrics |

---

## 5. Free-Tier AI Risk Assessment

| Provider | Model | Status | Limit | Risk |
|----------|-------|--------|-------|------|
| **Gemini** | gemini-1.5-flash | ❌ 503 errors | 15 RPM | **HIGH** - Remove from chain |
| **Groq** | qwen/qwen3.8-27b | ✅ Working | 30 RPM | **MEDIUM** - Queue max 1 concurrent |
| **Groq** | whisper-large-v3-turbo | ✅ Working | 20 RPM | **MEDIUM** - Queue + batch |
| **OpenRouter** | Various :free | ⚠️ Key unset | Varies | **HIGH** - Set key or remove |
| **Ollama** | Local | ✅ Working | Unlimited | **LOW** - Local only |

**Architecture Changes Needed:**
1. Remove Gemini from chain (unreliable)
2. Set OpenRouter key or remove tier
3. Request queue with max 1 concurrent Groq
4. Ollama primary for local; Groq cloud fallback
5. Cache aggressively (24h TTL implemented)
6. Batch Whisper calls (accumulate 3-5 chunks)

---

## 6. P1–P7 Implementation Plan (Sequential, No Approval Gates)

### P1: Foundation — Feature Flags + Speech Metrics + Curriculum + /today Redesign
**Effort**: 3-4 days
- [ ] `app_settings.feature_flags` table (server-side)
- [ ] `speech_metrics` unified table (per-turn: module, latency, WPM, pauses, VI segments, lifeline)
- [ ] `curriculum.json` — 13 topics × 2 rounds × 3 layers (L1/L2/L3)
- [ ] `getDayPlan(dayIndex, userStats)` pure function + unit tests
- [ ] `/today` — **6 blocks fixed order** (Shadowing 10', Reflex 20', Picture Talk 15', AI Speaking 30', Chunks 10', Voice Diary 5')
- [ ] VAD hook (`@ricky0123/vad-web`) for onset latency
- [ ] XP/Streak rewrite: +1 XP per 10s speaking; streak ≥3 min speaking/day

### P2: Reflex — 1,440 Phrases + FSRS+Latency Scheduler
**Effort**: 3-4 days
- [ ] Generate 1,440 phrases (8/day × 180) with `topic`, `round`, `layer`, `chunks[]`
- [ ] 5 sentence types: Q&A, Situation reaction, Continue, Paraphrase, Circumlocution
- [ ] FSRS + latency grading: <2s→Easy, 2-4s→Good, 4-6s→Hard, >6s/VI→Again
- [ ] Rotating Edge TTS voices (US/UK/AU, M/F)
- [ ] Hide "reflex" (VI→EN) mode behind flag; merge `/reflex/drills` → review mode

### P3: AI Speaking — FreeTalk Default + Talk Ratio + Missions
**Effort**: 3-4 days
- [ ] **FreeTalk default** (no scoring); Coach opt-in
- [ ] AI ≤25 words/turn, ends with open question; talk ratio ≥70%
- [ ] Persona + difficulty by layer (L1/L2/L3 from `getDayPlan`)
- [ ] 3-point feedback: praise → natural alternative → chunk to reuse
- [ ] Missions (60) tagged to curriculum topic + layer; G4+ work missions
- [ ] Provider fallback test (force-fail simulation)

### P4: Picture Talk — 52 Sets + 4/3/2 Fluency + Layer Mapping
**Effort**: 2-3 days
- [ ] 52 image sets = 13 topics × 4 images (Unsplash + attribution)
- [ ] Map levels: Describe→L1, Story→L2, Opinion+Teach→L3
- [ ] **4/3/2 fluency drill**: 90s→60s→45s (G1-G3) or 2'→90s→60s (G4-G5)
- [ ] "No stop" rule: pause >3s shows filler prompts (EN only)
- [ ] WPM chart: attempt 1 vs 3

### P5: Content Generation — Scripts + 3,000 Word Filter + Placement
**Effort**: 3-4 days
- [ ] Batch generation script (Gemini free) for 1,440 Reflex + 52 Picture Talk + weekly chunks
- [ ] **3,000 word filter**: NGSL 2,800 + top Oxford → 3,000; rest `extended=true`
- [ ] Placement test day 1 → `K` known words → `N = ceil((3000-K)/165)` new/day
- [ ] Chunks: 1 chunk + 1 sentence/week + audio + emoji; EN example first, VI hidden
- [ ] Mandatory speak 1 sentence per chunk before card rating
- [ ] Verify <5% words outside 3,000 list

### P6: Mirror + Real-World + Progress Dashboard + PWA Push
**Effort**: 2-3 days
- [ ] `mirror_recordings` table: 4×/week (3 fixed + 1 topic), Opus 32kbps
- [ ] Weekly comparison UI: Week 1 vs current, side-by-side + metrics delta
- [ ] Real-World ladder: G1 voice note→friend, G2 language exchange, G3 workplace, G4-G5 presentations
- [ ] Pre-task AI: 3 openers + 3 rescue phrases per situation
- [ ] North Star dashboard: 6 metrics with trend lines
- [ ] PWA push notification (free): "30 giây voice note thôi" at configured time

### P7: Assessment Redesign — CEFR Rubric + Milestone Auto-Adjust
**Effort**: 2-3 days
- [ ] Milestones: Baseline, 30, 60, 90, 135, 180
- [ ] Speaking: 3 recordings per layer → AI CEFR rubric (range, accuracy, fluency, interaction, coherence) 1-5 + explanation
- [ ] Objective metrics: latency, WPM, pauses, VI segments
- [ ] Auto-adjust targets from baseline (if baseline better, raise targets)
- [ ] Encouraging output: vs previous, strongest skill, 1 priority area

---

## 7. Critical Path & Dependencies

```
P1 (Foundation) ──► P2 (Reflex) ──► P3 (AI Speaking)
    │                    │
    │                    ▼
    └──────────────────► P4 (Picture Talk) ──► P5 (Content)
                                                      │
                                                      ▼
                                              P6 (Mirror + Real-World)
                                                      │
                                                      ▼
                                              P7 (Assessment)
```

**Total Estimated**: 18-24 days sequential

---

## 8. Immediate Blockers Requiring User Action

1. **Supabase Migrations**: Apply 8 missing tables via Dashboard SQL Editor (no DB password for REST)
2. **OpenRouter API Key**: Set `OPENROUTER_API_KEY` in Vercel env
3. **Groq Concurrency**: Accept 1-at-a-time queue or provide higher tier
4. **Image Hosting**: Confirm Supabase Storage bucket for 52 Picture Talk images

---

## 9. Sign-Off

This audit reflects the **actual current working directory state** (not the `feat/speaking-ai-upgrade` branch). All findings are evidence-based from code inspection.

**Ready to proceed with P1 implementation.**
# EnVi — Security Handoff: Keys & Passwords to Rotate

> Created: 2026-11-23. **No secret values are stored in this document** — only variable names and locations.

## Priority Order

### 1. Database Password — CRITICAL (appeared in chat)

| Item | Detail |
|------|--------|
| **What** | Supabase PostgreSQL password |
| **Why rotate** | Exposed in chat history during production migration work |
| **Where used** | Docker `psql` commands for `production_v2_combined.sql` application; any direct DB connection strings |
| **How to rotate** | Supabase Dashboard → Project → **Settings → Database → Database password** → Reset password |
| **After rotation** | Update any scripts that use direct DB connections. The app itself uses Supabase JS client (anon key), NOT direct DB password — so no app code change needed. |
| **Urgency** | HIGH — do first |

### 2. Supabase Service Role Key — CRITICAL

| Item | Detail |
|------|--------|
| **What** | `SUPABASE_SERVICE_ROLE_KEY` (JWT `sb_secret_...`) |
| **Why rotate** | Exposed in PROJECT_MANIFEST.md (now cleaned, but was in chat) |
| **Where used** | `.env.local` (local scripts: import-words, import-phrases, backup/restore); NOT used by app code at runtime (app uses anon key + RLS) |
| **How to rotate** | Supabase Dashboard → **Settings → API → service_role key** → Generate new key |
| **After rotation** | Update `.env.local` with new key; update Vercel env var if set (not currently set in Vercel — service role is local-only) |
| **Urgency** | HIGH |

### 3. Groq API Key — HIGH

| Item | Detail |
|------|--------|
| **What** | `GROQ_API_KEY` |
| **Why rotate** | Exposed in PROJECT_MANIFEST.md (now cleaned, but was in chat) |
| **Where used** | `.env.local` + Vercel env var; used by `lib/ai/groq.ts` (text AI) + `lib/ai/whisper.ts` (STT) |
| **How to rotate** | Groq Console → **API Keys** → Delete old key → Create new key |
| **After rotation** | Update `.env.local` + Vercel → Settings → Environment Variables → `GROQ_API_KEY` |
| **Urgency** | HIGH |

### 4. Gemini API Key — HIGH

| Item | Detail |
|------|--------|
| **What** | `GEMINI_API_KEY` |
| **Why rotate** | Exposed in PROJECT_MANIFEST.md (now cleaned, but was in chat) |
| **Where used** | `.env.local` + Vercel env var; used by `lib/ai/gemini.ts` (fallback AI) |
| **How to rotate** | Google AI Studio → **API Keys** → Delete old key → Create new key |
| **After rotation** | Update `.env.local` + Vercel → Settings → Environment Variables → `GEMINI_API_KEY` |
| **Urgency** | HIGH |

### 5. QA Account Password — MEDIUM

| Item | Detail |
|------|--------|
| **What** | QA account password for `qa.test.a@gmail.com` |
| **Why rotate** | Exposed in chat and test files (tests use `QA_PASSWORD` env var) |
| **Where used** | Test files (`process.env.QA_PASSWORD`); Supabase Auth user |
| **How to rotate** | Supabase Dashboard → **Authentication → Users** → Find QA account → Reset password |
| **After rotation** | Update `QA_PASSWORD` env var when running tests |
| **Urgency** | MEDIUM |

### 6. CRON_SECRET — NOT YET SET (cron waiting approval)

| Item | Detail |
|------|--------|
| **What** | `CRON_SECRET` (random string) |
| **Why** | `/api/cron/*` route returns 401 if unset |
| **Where used** | Vercel env var; `app/cron/` route handler |
| **How to set** | Generate: `openssl rand -hex 32` (or any random string) → Add to Vercel → Settings → Environment Variables → `CRON_SECRET` |
| **Urgency** | LOW (cron not enabled yet — waiting user approval) |

## NOT Urgent (public or auto-rotated)

| Variable | Why safe |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public URL, safe to expose |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (protected by RLS), safe to expose |
| `VERCEL_OIDC_TOKEN` | Short-lived, auto-rotated by Vercel CLI |
| `OLLAMA_BASE_URL` / `OLLAMA_MODEL` | Local-only, no secret |

## Checklist

- [ ] Rotate Supabase DB password (Dashboard → Database → Password)
- [ ] Rotate Supabase service role key (Dashboard → Settings → API)
- [ ] Rotate Groq API key (Groq Console)
- [ ] Rotate Gemini API key (Google AI Studio)
- [ ] Reset QA account password (Dashboard → Authentication → Users)
- [ ] Update `.env.local` with new keys
- [ ] Update Vercel env vars with new keys (Settings → Environment Variables)
- [ ] Redeploy Vercel after env var update
- [ ] Generate + add `CRON_SECRET` to Vercel (when cron approved)
- [ ] Add `gitleaks` or `secretlint` to pre-commit hook

## Where secrets are referenced in code (for verification)

| File | Variable | Type |
|------|----------|------|
| `lib/supabase/server.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (client-safe) |
| `lib/supabase/client.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (client-safe) |
| `lib/ai/groq.ts` | `GROQ_API_KEY` | Server-only |
| `lib/ai/gemini.ts` | `GEMINI_API_KEY` | Server-only |
| `lib/ai/whisper.ts` | `GROQ_API_KEY` | Server-only |
| `lib/ai/router.ts` | `GROQ_MODEL`, `GEMINI_MODEL`, `AI_PROVIDER_CHAIN` | Server-only |
| `app/cron/` | `CRON_SECRET` | Server-only |
| `.env.local` | `SUPABASE_SERVICE_ROLE_KEY` | Local scripts only |
| Tests | `QA_EMAIL`, `QA_PASSWORD` | Test env vars |
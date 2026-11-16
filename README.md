# EnVi — Luyện nói tiếng Anh mỗi ngày

Website học tiếng Anh cá nhân hoá (Next.js + Supabase), tối ưu cho luyện tập hằng
ngày: AI Speaking Coach, flashcard 3000 từ (SRS), shadowing, dictation, đọc to,
ngữ pháp 6 thì, lộ trình 90 ngày.

## Tech stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
- **Supabase**: Postgres + Auth + Storage + Row Level Security
- **AI**: Google Gemini (free tier) chính + Groq (free tier) fallback
- **Voice**: Web Speech API + Edge TTS + Groq Whisper (STT fallback)
- **Deploy**: Vercel

## Cài đặt

```bash
npm install
cp .env.example .env.local   # điền Supabase URL/anon key + Gemini/Groq key
npm run dev                  # http://localhost:3000
```

### Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Anon key (công khai) |
| `GEMINI_API_KEY` | ✅ (server) | Google Gemini free tier |
| `GROQ_API_KEY` | ⬜ (nên có) | Groq fallback + Whisper STT |

> `GEMINI_API_KEY` và `GROQ_API_KEY` chỉ dùng ở server, không có tiền tố
> `NEXT_PUBLIC_`. Không bao giờ commit `.env*`.

## Database

Migration nằm ở `db/migrations/`. Áp dụng bằng Supabase SQL Editor hoặc CLI:

```bash
supabase db push   # nếu dùng Supabase CLI
```

Migration `0001_init.sql` tạo toàn bộ schema + RLS + trigger tạo profile +
function `delete_my_account()` (xoá tài khoản & dữ liệu).

## Scripts

```bash
npm run dev         # dev server
npm run build       # build production
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
```

## Cấu trúc

```
app/              # App Router: (main) khu đăng nhập, login, auth/callback
components/       # UI (shadcn) + component theo chức năng
lib/              # supabase clients, utils
db/migrations/    # SQL migrations
middleware.ts     # refresh session + bảo vệ route
```

## Lộ trình

- **Phase 0** ✅ Skeleton + Auth + design system xanh/trắng + migration + CI
- Phase 1 — Flashcard 3000 từ + SRS
- Phase 2 — AI Speaking Coach (5 bước) + eval
- Phase 3 — Shadowing + Dictation + Reading Aloud
- Phase 4 — Ngữ pháp 6 thì + Dashboard + Lộ trình 90 ngày
- Phase 5 — AI Assistant + P1
- Phase 6 — Polish + deploy
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

Migration `0002_words_extend.sql` thêm `cefr_level` + unique index.

## Scripts

```bash
npm run dev         # dev server
npm run build       # build production
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm run import:words  # import từ vựng từ CSV
```

## Cấu trúc

```
app/              # App Router: (main) khu đăng nhập, login, auth/callback
components/       # UI (shadcn) + component theo chức năng
lib/              # supabase clients, utils, AI clients
db/migrations/    # SQL migrations
middleware.ts     # refresh session + bảo vệ route (proxy.ts)
```

## Lộ trình

- **Phase 0** ✅ Skeleton + Auth + design system xanh/trắng + migration + CI
- **Phase 1** ✅ Flashcard 3000 từ + SRS + import 5029 từ
- **Phase 2** ✅ AI Speaking Coach (5 bước) + eval
- **Phase 3** ✅ Shadowing (Media Player + Transcript) + Dictation (diff highlight) + Reading Aloud
- **Phase 4** ✅ Ngữ pháp 6 thì + Dashboard (streak, minutes, 7-day chart) + Lộ trình 90 ngày
- **Phase 5** ✅ AI Assistant (chatbot UI) + Settings (AI usage counter)
- **Phase 6** ✅ Polish + deploy ready

## Tính năng

- **Speaking**: AI Speaking Coach 5 bước với Gemini/Groq
- **Vocabulary**: Flashcard SRS với 5029 từ (Oxford 5000 + NGSL)
- **Shadowing**: Media player với transcript click-to-seek + record & compare
- **Dictation**: TTS audio + diff highlight (từ đúng xanh, sai đỏ)
- **Reading**: Đoạn văn + TTS + record để luyện phát âm
- **Grammar**: 6 thì cơ bản + bài tập trắc nghiệm
- **Roadmap**: Lộ trình 90 ngày + daily check-in + streak
- **Dashboard**: Thống kê streak, phút học, biểu đồ 7 ngày
- **Assistant**: Chatbot AI hỏi đáp
- **Settings**: Hồ sơ + AI usage stats

## License

MIT
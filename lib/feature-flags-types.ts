export type FeatureFlag =
  | "reading"
  | "writing"
  | "grammar_translation"
  | "reflex_translation"
  | "self_talk"
  | "progress_test_14day"
  | "dictation"
  | "vocab_extended"
  | "assistant_chat"
  | "global_search";

export const FEATURE_FLAG_DEFAULTS: Record<FeatureFlag, boolean> = {
  reading: false,
  writing: false,
  grammar_translation: false,
  reflex_translation: false,
  self_talk: false,
  progress_test_14day: false,
  dictation: false,
  vocab_extended: false,
  assistant_chat: false,
  global_search: false,
};

export const FEATURE_FLAG_LABELS: Record<FeatureFlag, string> = {
  reading: "Đọc hiểu (Reading)",
  writing: "Viết (Writing)",
  grammar_translation: "Ngữ pháp dịch thuật",
  reflex_translation: "Reflex dịch & nói",
  self_talk: "Self-talk cũ",
  progress_test_14day: "Progress test 14 ngày",
  dictation: "Dictation",
  vocab_extended: "Từ vựng mở rộng (>3000 từ)",
  assistant_chat: "Trợ lý chat",
  global_search: "Tìm kiếm toàn cục",
};

export const FEATURE_FLAG_DESCRIPTIONS: Record<FeatureFlag, string> = {
  reading: "Bài đọc dài, không tập trung nói",
  writing: "Viết tự do, không phải Work Writing",
  grammar_translation: "Dạng bài dịch VI→EN, củng cố thói quen dịch trong đầu",
  reflex_translation: "Chế độ cũ: xem câu Việt rồi dịch sang Anh",
  self_talk: "Đã thay bằng Voice Diary trong /today",
  progress_test_14day: "Đã gộp vào Checkpoint 0/30/60/90/135/180",
  dictation: "Không nằm trong luồng /today mặc định (tự chọn)",
  vocab_extended: "3000 từ cốt lõi đã đủ, phần mở rộng ẩn mặc định",
  assistant_chat: "Chat tự do, không đo lường được speaking",
  global_search: "Tìm kiếm nội dung, không liên quan mục tiêu nói",
};
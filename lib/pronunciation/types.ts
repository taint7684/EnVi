export type MouthGuide = {
  tongue: string;
  lips: string;
  throat: string;
  airflow: string;
};

export type MinimalPair = {
  word1: string;
  ipa1: string;
  word2: string;
  ipa2: string;
  vi: string;
};

export type QuickTestItem = {
  type: "listen-choose" | "speak-sentence";
  prompt: string;
  audio_text?: string;
  options?: string[];
  answer?: number;
  target?: string;
};

export type PronunciationFocus = {
  id: string;
  num: number;
  title_vi: string;
  ipa: string;
  category: "consonant" | "vowel" | "suprasegmental" | "connected_speech";
  description_vi: string;
  tip_vi: string;
  mouth_guide: MouthGuide;
  minimal_pairs: MinimalPair[];
  words: string[];
  phrases: string[];
  sentences: string[];
  quick_test: QuickTestItem[];
};

export type PronunciationProgress = {
  focusId: string;
  mastery: number;
  attempts: number;
  lastPracticed: string | null;
  status: "new" | "practicing" | "mastered" | "weak";
};

export const CATEGORY_LABELS: Record<string, string> = {
  consonant: "Phụ âm",
  vowel: "Nguyên âm",
  suprasegmental: "Trọng âm",
  connected_speech: "Nối âm",
};

export const STEP_LABELS = [
  { id: 1, title: "Học âm", description: "Nghe phát âm chuẩn + hướng dẫn đặt miệng" },
  { id: 2, title: "Cặp từ tối thiểu", description: "Phân biệt các cặp từ dễ nhầm" },
  { id: 3, title: "Từ & cụm từ", description: "Luyện trong từ đơn và cụm ngắn" },
  { id: 4, title: "Luyện trong câu", description: "Đọc to các câu chứa âm đang học" },
  { id: 5, title: "Kiểm tra nhanh", description: "5-8 câu hỏi ngắn để đánh giá" },
] as const;
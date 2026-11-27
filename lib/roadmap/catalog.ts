export type Phase = "P1" | "P2" | "P3" | "P4" | "maintenance";

export type PhaseInfo = {
  phase: Phase;
  label: string;
  viPercent: number; // tỉ lệ tiếng Việt tối đa trong lời nhắc
};

/** Xác định giai đoạn theo ngày học (BR-15.1: ngày học ≠ ngày lịch). */
export function phaseForDay(day: number): PhaseInfo {
  if (day <= 30) return { phase: "P1", label: "Phá băng (A2)", viPercent: 70 };
  if (day <= 60) return { phase: "P2", label: "Bứt phá (B1)", viPercent: 30 };
  if (day <= 90) return { phase: "P3", label: "Thực chiến (B2)", viPercent: 0 };
  if (day <= 180)
    return { phase: "P4", label: "Nâng cao (B2+)", viPercent: 0 };
  return { phase: "maintenance", label: "Duy trì (B2+)", viPercent: 0 };
}

/** Tuần (1..26) của lộ trình 180 ngày; sau 180 trả null (vòng duy trì). */
export function weekForDay(day: number): number | null {
  if (day < 1 || day > 180) return null;
  return Math.min(26, Math.floor((day - 1) / 7) + 1);
}

export function isMaintenance(day: number): boolean {
  return day > 180;
}

/** Ngày bắt đầu của mỗi tuần (1-based) trong lộ trình 180 ngày. */
export function startDayOfWeek(week: number): number {
  return (week - 1) * 7 + 1;
}

/** Có phải ngày Checkpoint (0/30/60/90/120/150/180) không. */
export function isCheckpointDay(day: number): boolean {
  return day === 30 || day === 60 || day === 90 || day === 120 || day === 150 || day === 180;
}

/** Theme gợi ý theo tuần (8.15.2). */
export const WEEK_THEMES: string[] = [
  "Giới thiệu bản thân & công việc",
  "Thói quen hằng ngày & văn phòng",
  "Đồ ăn, mua sắm, nhà hàng",
  "Daily standup & tiến độ",
  "Làm rõ yêu cầu & câu hỏi",
  "Giải thích vấn đề/bug",
  "Du lịch & sân bay",
  "Kể chuyện & trải nghiệm",
  "Demo & thuyết trình ngắn",
  "Đàm phán & phản đối lịch sự",
  "Họp với khách hàng & xử lý phàn nàn",
  "Phỏng vấn xin việc",
  "Tổng hợp & Mission lớn",
  "Thuyết trình & báo cáo nâng cao",
  "Đàm phán phức tạp",
  "Quản lý dự án & rủi ro",
  "Phân tích dữ liệu & trực quan",
  "Viết tài liệu kỹ thuật",
  "Họp đa văn hóa",
  "Xử lý sự cố & khủng hoảng",
  "Đào tạo & hướng dẫn",
  "Mạng lưới & quan hệ",
  "Ra quyết định & ưu tiên",
  "Tổng hợp dự án lớn",
  "Ôn tập chuyên sâu",
  "Đánh giá & kế hoạch tiếp",
];

export function themeForWeek(week: number): string {
  return WEEK_THEMES[week - 1]! ?? WEEK_THEMES[WEEK_THEMES.length - 1]!;
}
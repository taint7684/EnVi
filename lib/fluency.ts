export type FluencyMetrics = {
  latencyMs: number | null;
  wpm: number | null;
  mlr: number | null;
  pauseCount: number | null;
  pauseCountLong: number | null;
  totalPauseMs: number | null;
  speechSec: number | null;
  wordCount: number | null;
};

type WhisperWord = {
  word: string;
  start: number;
  end: number;
};

/**
 * Tính các chỉ số trôi chảy từ danh sách từ có timestamp (Whisper verbose_json).
 * - WPM: số từ / số phút nói (loại bỏ khoảng lặng)
 * - MLR: độ dài trung bình của các đoạn nói liên tục (khoảng cách giữa các từ > 0.4s ngắt đoạn, theo MASTER_SPEC 8.17)
 * - Pause: số lần tách > 0.4s (pauseCount) + số lần tách > 1.0s (pauseCountLong, long-pause ratio), tổng thời gian tách
 */
export function computeFluencyFromWords(
  words: WhisperWord[],
  latencyMs: number | null = null,
): FluencyMetrics {
  if (!words || words.length === 0) {
    return {
      latencyMs,
      wpm: null,
      mlr: null,
      pauseCount: null,
      pauseCountLong: null,
      totalPauseMs: null,
      speechSec: null,
      wordCount: 0,
    };
  }

  const MLR_PAUSE_SEC = 0.4;
  const LONG_PAUSE_SEC = 1.0;

  let totalPauseMs = 0;
  let pauseCount = 0;
  let pauseCountLong = 0;
  let runWordCount = 1;
  const runLengths: number[] = [];

  for (let i = 1; i < words.length; i++) {
    const gap = words[i]!.start - words[i - 1]!.end;
    if (gap > MLR_PAUSE_SEC) {
      pauseCount += 1;
      if (gap > LONG_PAUSE_SEC) pauseCountLong += 1;
      totalPauseMs += gap * 1000;
      runLengths.push(runWordCount);
      runWordCount = 1;
    } else {
      runWordCount += 1;
    }
  }
  runLengths.push(runWordCount);

  const firstStart = words[0]!.start;
  const lastEnd = words[words.length - 1]!.end;
  const totalSpanSec = lastEnd - firstStart;
  const speechSec = Math.max(0, totalSpanSec - totalPauseMs / 1000);
  const wordCount = words.length;

  const wpm = speechSec > 0 ? (wordCount / speechSec) * 60 : null;
  const mlr =
    runLengths.length > 0
      ? runLengths.reduce((a, b) => a + b, 0) / runLengths.length
      : null;

  return {
    latencyMs,
    wpm: wpm ? Math.round(wpm * 10) / 10 : null,
    mlr: mlr ? Math.round(mlr * 10) / 10 : null,
    pauseCount,
    pauseCountLong,
    totalPauseMs: Math.round(totalPauseMs),
    speechSec: speechSec > 0 ? Math.round(speechSec * 100) / 100 : null,
    wordCount,
  };
}

/**
 * Tính độ trễ mở miệng (latency): thời gian từ khi AI dừng đọc câu hỏi đến khi
 * người học bắt đầu phát âm (giữ từ VAD client-side).
 */
export function computeLatency(
  askCompleteAt: number | null,
  userStartSpeakAt: number | null,
): number | null {
  if (askCompleteAt === null || userStartSpeakAt === null) return null;
  const latency = userStartSpeakAt - askCompleteAt;
  return latency < 0 ? 0 : latency;
}

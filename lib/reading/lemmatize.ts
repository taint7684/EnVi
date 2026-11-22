/**
 * Lemmatizer đơn giản cho tiếng Anh (đủ dùng cho tra từ khi đọc).
 * Không hoàn hảo nhưng xử lý các biến thể phổ biến: plural -s/-es, -ed, -ing, -er/-est.
 */
export function lemmatize(word: string): string {
  const w = word.toLowerCase().replace(/[^a-z']/g, "");
  if (w.length <= 3) return w;

  const rules: Array<[RegExp, string]> = [
    [/ies$/, "y"], // studies -> study
    [/ves$/, "f"], // wolves -> wolf (approx)
    [/(s|x|z|ch|sh)es$/, "$1"], // boxes -> box, watches -> watch
    [/([^s])s$/, "$1"], // cats -> cat
    [/ied$/, "y"], // studied -> study
    [/ed$/, ""], // worked -> work
    [/ing$/, ""], // running -> runn (fixable)
    [/er$/, ""], // faster -> fast
    [/est$/, ""], // fastest -> fast
  ];
  for (const [re, repl] of rules) {
    if (re.test(w)) {
      const candidate = w.replace(re, repl);
      // Avoid over-stripping very short results
      if (candidate.length >= 2) return candidate;
    }
  }
  return w;
}

/** Danh sách ứng viên để tra: chính từ + lemma. */
export function lookupCandidates(word: string): string[] {
  const w = word.toLowerCase();
  const lemma = lemmatize(w);
  return Array.from(new Set([w, lemma]));
}
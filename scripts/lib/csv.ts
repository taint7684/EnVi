export type CsvTable = {
  headers: string[];
  rows: Record<string, string>[];
};

/** Parser CSV tối giản (RFC4180): hỗ trợ dấu nháy kép, escape "", CRLF, BOM. */
export function parseCsv(content: string): CsvTable {
  const text = content.replace(/^\uFEFF/, "");
  const records: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    records.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      pushField();
    } else if (c === "\n") {
      pushRow();
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) pushRow();

  while (records.length > 0) {
    const last = records[records.length - 1];
    if (last.length === 1 && last[0].trim() === "") records.pop();
    else break;
  }

  const headers = (records.shift() ?? []).map((h) => h.trim());
  const rows = records
    .map((r) => {
      const obj: Record<string, string> = {};
      for (let i = 0; i < headers.length; i++) {
        obj[headers[i]] = (r[i] ?? "").trim();
      }
      return obj;
    })
    .filter((obj) => Object.values(obj).some((v) => v !== ""));

  return { headers, rows };
}
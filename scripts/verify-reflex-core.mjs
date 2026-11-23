import { readFileSync } from "node:fs";
import { join } from "node:path";

const envFile = readFileSync(join(process.cwd(), ".env.local"), "utf-8");
function getEnv(name) {
  const line = envFile.split(/\r?\n/).find((l) => l.startsWith(name + "="));
  return line ? line.slice(name.length + 1).trim() : "";
}

const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");

async function fetchAll() {
  const pageSize = 1000;
  let offset = 0;
  const all = [];
  while (true) {
    const res = await fetch(
      `${url}/rest/v1/phrases?select=id,en_text,en_alternatives,situation_en,keywords&limit=${pageSize}&offset=${offset}`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "User-Agent": "EnVi-Audit/1.0",
        },
      },
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`PostgREST ${res.status}: ${body.slice(0, 300)}`);
    }
    const batch = await res.json();
    if (!Array.isArray(batch)) {
      throw new Error(`Unexpected response (not array): ${JSON.stringify(batch).slice(0, 300)}`);
    }
    if (batch.length === 0) break;
    all.push(...batch);
    if (batch.length < pageSize) break;
    offset += pageSize;
  }
  return all;
}

function main() {
  fetchAll()
    .then((rows) => {
      const total = rows.length;
      const withAlt = rows.filter(
        (r) => Array.isArray(r.en_alternatives) && r.en_alternatives.length > 0,
      ).length;
      const withSit = rows.filter(
        (r) => typeof r.situation_en === "string" && r.situation_en.trim().length > 0,
      ).length;
      const withKw = rows.filter(
        (r) => Array.isArray(r.keywords) && r.keywords.length > 0,
      ).length;
      const allCore = rows.filter(
        (r) =>
          Array.isArray(r.en_alternatives) &&
          r.en_alternatives.length > 0 &&
          typeof r.situation_en === "string" &&
          r.situation_en.trim().length > 0 &&
          Array.isArray(r.keywords) &&
          r.keywords.length > 0,
      ).length;

      console.log("=== Reflex Core Verification ===");
      console.log(`Total phrases:            ${total}`);
      console.log(`With en_alternatives:     ${withAlt}`);
      console.log(`With situation_en:        ${withSit}`);
      console.log(`With keywords:            ${withKw}`);
      console.log(`With ALL 3 core fields:   ${allCore}`);
      console.log(`Spec target:              >= 1354`);
      console.log(`Result:                   ${allCore >= 1354 ? "PASS" : "FAIL"}`);
      if (allCore < 1354) process.exit(1);
    })
    .catch((e) => {
      console.error("Error:", e.message);
      process.exit(1);
    });
}

main();
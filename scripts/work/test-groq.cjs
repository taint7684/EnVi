const fs = require("fs");
const path = require("path");
const env = {};
for (const l of fs.readFileSync(path.join(__dirname, "..", "..", ".env.local"), "utf8").split(/\r?\n/)) {
  const i = l.indexOf("=");
  if (i > 0) {
    let v = l.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[l.slice(0, i).trim()] = v;
  }
}
const key = env.GROQ_API_KEY;
if (!key) { console.log("NO KEY"); process.exit(1); }
fetch("https://api.groq.com/openai/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
  body: JSON.stringify({ model: "openai/gpt-oss-20b", messages: [{ role: "user", content: "Say OK" }], max_tokens: 5, reasoning_effort: "low" }),
  signal: AbortSignal.timeout(15000),
}).then(async r => {
  console.log("status:", r.status);
  const t = await r.text();
  console.log("body:", t.slice(0, 300));
}).catch(e => console.log("error:", e.message));
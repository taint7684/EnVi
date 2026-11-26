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
console.log("GROQ_API_KEY:", env.GROQ_API_KEY ? "SET" : "MISSING");
const geminiKeys = Object.keys(env).filter((k) => /gemini|google|generative|genai/i.test(k));
console.log("Gemini/Google keys:", geminiKeys.length ? geminiKeys.join(", ") : "none");
console.log("All env keys:", Object.keys(env).join(", "));
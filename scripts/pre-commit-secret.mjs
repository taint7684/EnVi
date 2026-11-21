// Pre-commit secret scan: chặn commit jika file staged chua gia tri secret thuc.
// Chay voi: node scripts/pre-commit-secret.mjs
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const SECRET_PATTERNS = [
  /gsk_[A-Za-z0-9\-_]{20,}/,             // Groq
  /sb_secret_[A-Za-z0-9\-_]{20,}/,       // Supabase service role
  /sb_publishable_[A-Za-z0-9\-_]{20,}/,  // Supabase anon
  /sk_live_[A-Za-z0-9]{20,}/,            // Stripe live
  /sk_test_[A-Za-z0-9]{20,}/,            // Stripe test
  /AKIA[0-9A-Z]{16}/,                    // AWS access key
  /AIza[0-9A-Za-z\-_]{35,}/,             // Google API key
];

const EXT_ALLOWED = [".ts", ".tsx", ".js", ".mjs", ".json", ".md", ".env", ".example"];

function getStagedFiles() {
  const out = execSync("git diff --cached --name-only --diff-filter=ACM", {
    encoding: "utf8",
  }).trim();
  if (!out) return [];
  return out.split(/\n/).map((s) => s.trim()).filter(Boolean);
}

function hasSecret(text) {
  return SECRET_PATTERNS.some((re) => re.test(text));
}

function main() {
  const files = getStagedFiles();
  let found = false;
  for (const file of files) {
    const ext = file.slice(file.lastIndexOf("."));
    if (!EXT_ALLOWED.includes(ext)) continue;
    try {
      const text = readFileSync(file, "utf8");
      if (hasSecret(text)) {
        console.error("[pre-commit] PHAT HIEN SECRET trong file staged: " + file);
        found = true;
      }
    } catch {
      // bo qua file khong doc duoc (binary, v.v.)
    }
  }
  if (found) {
    console.error(
      "[pre-commit] HUY BO commit: vui long thay gia tri secret bang ten bien env (vd <GROQ_API_KEY>) roi thu lai.",
    );
    process.exit(1);
  }
  console.log("[pre-commit] Khong phat hien secret. OK.");
}

main();

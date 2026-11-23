// EnVi - Reset QA account password on Supabase Production
// Chay: node scripts/reset-qa-password.mjs
// Mat khau moi duoc nhap an (khong hien tren man hinh)

import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stderr } from "node:process";

const QA_EMAIL = "qa.test.a@gmail.com";

function loadEnv() {
  const content = readFileSync(".env.local", "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].trim();
  }
  return env;
}

function readHidden(prompt) {
  return new Promise((resolve) => {
    stderr.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf-8");
    let input = "";
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === "\n" || char === "\r") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener("data", onData);
          stderr.write("\n");
          resolve(input);
          return;
        } else if (char === "\u0003") {
          stdin.setRawMode(false);
          stderr.write("\n");
          process.exit(0);
        } else if (char === "\u007f" || char === "\b") {
          if (input.length > 0) input = input.slice(0, -1);
        } else {
          input += char;
        }
      }
    };
    stdin.on("data", onData);
  });
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("ERROR: Missing env vars");
    process.exit(1);
  }

  console.log("");
  console.log("=== EnVi - Reset QA Password ===");
  console.log(`Tai khoan: ${QA_EMAIL}`);
  console.log("");

  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };

  // Find user
  const userResp = await fetch(`${url}/auth/v1/admin/users?filter=${QA_EMAIL}`, { headers });
  if (!userResp.ok) {
    console.error(`ERROR (${userResp.status}): ${await userResp.text()}`);
    process.exit(1);
  }
  const usersData = await userResp.json();
  const qaUser = usersData.users?.find((u) => u.email === QA_EMAIL);

  if (!qaUser) {
    console.error(`ERROR: Khong tim thay tai khoan ${QA_EMAIL}`);
    usersData.users?.forEach((u) => console.log(`  - ${u.email} (id: ${u.id})`));
    process.exit(1);
  }

  console.log("Tim thay:");
  console.log(`  Email: ${qaUser.email}`);
  console.log(`  ID: ${qaUser.id}`);
  console.log(`  Created: ${qaUser.created_at}`);
  console.log("");

  // Hidden password input
  const password = await readHidden("Mat khau moi (an): ");
  if (!password || password.length < 6) {
    console.error("ERROR: Mat khau phai >= 6 ky tu");
    process.exit(1);
  }

  const confirm = await readHidden("Xac nhan (an): ");
  if (password !== confirm) {
    console.error("ERROR: Mat khau xac nhan khong khop");
    process.exit(1);
  }

  console.log("");
  console.log("Dang cap nhat...");

  const updateResp = await fetch(`${url}/auth/v1/admin/users/${qaUser.id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ password }),
  });

  if (!updateResp.ok) {
    console.error(`ERROR (${updateResp.status}): ${await updateResp.text()}`);
    process.exit(1);
  }

  console.log("");
  console.log("SUCCESS - Mat khau da duoc cap nhat!");
  console.log("");
  console.log(`Tai khoan: ${QA_EMAIL}`);
  console.log("Buoc tiep theo:");
  console.log("  1. Cap nhat QA_PASSWORD moi trong .env.local");
  console.log("  2. Dang nhap thu: https://envi-deploy-one.vercel.app/login");
  console.log("");
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
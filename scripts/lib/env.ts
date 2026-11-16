import dotenv from "dotenv";
import { existsSync } from "node:fs";

/** Nạp .env.local (ưu tiên) rồi tới .env. Chỉ dùng ở script Node, không bundle client. */
export function loadEnv(): void {
  if (existsSync(".env.local")) {
    dotenv.config({ path: ".env.local" });
  } else {
    dotenv.config();
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Thiếu biến môi trường ${name}. Kiểm tra file .env.local (không commit file này).`,
    );
  }
  return value.trim();
}
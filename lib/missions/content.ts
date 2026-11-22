import "server-only";

import missionsJson from "@/data/missions.json";
import { MissionSchema, type Mission } from "./schema";

let cache: Mission[] | null = null;

/** Nạp nội dung mission từ repo (data/missions.json), validate bằng zod. */
export function loadMissionContent(): Mission[] {
  if (cache) return cache;
  const parsed = missionsJson.map((m, i) => {
    try {
      return MissionSchema.parse(m);
    } catch (err) {
      throw new Error(`Mission #${i} (${(m as { id?: string }).id ?? "?"}) không hợp lệ: ${String(err)}`);
    }
  });
  cache = parsed;
  return parsed;
}

export function findMissionContent(id: string): Mission | null {
  return loadMissionContent().find((m) => m.id === id) ?? null;
}
import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { PictureTalkImage } from "@/lib/picture-talk-types";

export type {
  PictureVocabulary,
  PictureTalkImage,
  PictureLevel,
} from "@/lib/picture-talk-types";

export {
  LEVEL_LABELS,
  LEVEL_DESCRIPTIONS,
} from "@/lib/picture-talk-types";

let _cache: PictureTalkImage[] | null = null;

function load(): PictureTalkImage[] {
  if (_cache) return _cache;
  const filePath = path.join(process.cwd(), "data", "picture-talk-images.json");
  if (!fs.existsSync(filePath)) { _cache = []; return []; }
  _cache = JSON.parse(fs.readFileSync(filePath, "utf8")) as PictureTalkImage[];
  return _cache;
}

export function getAllPictures(): PictureTalkImage[] { return load(); }

export function getPictureById(id: string): PictureTalkImage | undefined {
  return load().find((p) => p.id === id);
}

export function getPicturesByTopic(topic: string): PictureTalkImage[] {
  return load().filter((p) => p.topic === topic);
}

export function getTopics(): string[] {
  return [...new Set(load().map((p) => p.topic))].sort();
}

export function getTotalCount(): number { return load().length; }
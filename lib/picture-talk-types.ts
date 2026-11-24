export type PictureVocabulary = {
  word: string;
  type: "action" | "state" | "object";
  example: string;
};

export type PictureTalkImage = {
  id: string;
  title: string;
  titleVi: string;
  imageUrl: string;
  level: string;
  topic: string;
  vocabulary: PictureVocabulary[];
  opinion_questions: string[];
  story_starters: string[];
};

export type PictureLevel = "describe" | "opinion" | "story" | "teach";

export const LEVEL_LABELS: Record<PictureLevel, string> = {
  describe: "Mô tả",
  opinion: "Nêu ý kiến",
  story: "Kể chuyện",
  teach: "Dạy lại",
};

export const LEVEL_DESCRIPTIONS: Record<PictureLevel, string> = {
  describe: "Describe what you see in the picture.",
  opinion: "Give your opinion about the situation.",
  story: "Tell a story based on the picture.",
  teach: "Imagine you are teaching this scene to someone.",
};
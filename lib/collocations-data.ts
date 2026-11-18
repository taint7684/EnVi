import raw from "@/data/collocations.json";

export type CollocationType = "collocation" | "phrasal";

export type Collocation = {
  en: string;
  vi: string;
  example: string;
  type: CollocationType;
};

export const COLLOCATIONS = raw as Collocation[];
import { ReflexDrillsHome } from "@/components/reflex/reflex-drills-home";
import { getAllPhrases } from "@/lib/reflex-drills-data";

export default function ReflexDrillsPage() {
  const phrases = getAllPhrases();
  return <ReflexDrillsHome phrases={phrases} />;
}
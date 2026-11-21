import { SpeakingHome } from "@/components/speaking/speaking-home";
import { TranslateSpeak } from "@/components/translate-speak";

export default function SpeakingPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <SpeakingHome />
      <TranslateSpeak />
    </div>
  );
}

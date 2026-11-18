import { AssistantChat } from "@/components/assistant/assistant-chat";
import { getUserLearningSnapshot } from "@/app/actions/learning-snapshot";

export default async function AssistantPage() {
  const snapshot = await getUserLearningSnapshot();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 font-serif text-2xl font-semibold">
        Trợ lý AI — Gia sư cá nhân
      </h1>
      <p className="mb-6 text-muted-foreground">
        Dựa trên dữ liệu học tập thực tế của bạn để đưa ra lời khuyên phù hợp.
      </p>

      <AssistantChat snapshot={snapshot} />
    </div>
  );
}
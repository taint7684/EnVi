import { AssistantChat } from "@/components/assistant/assistant-chat";

export default function AssistantPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 font-serif text-2xl font-semibold">Trợ lý AI</h1>
      <p className="mb-6 text-muted-foreground">
        Hỏi đáp về tiếng Anh, ngữ pháp, từ vựng, hoặc luyện nói.
      </p>

      <AssistantChat />
    </div>
  );
}
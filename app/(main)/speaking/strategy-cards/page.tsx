import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loadStrategyCards } from "@/lib/strategy/content";

export const metadata = { title: "Thẻ chiến lược giao tiếp — EnVi" };

export default function StrategyCardsPage() {
  const cards = loadStrategyCards();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Thẻ chiến lược giao tiếp</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          12 chiến lược giúp bạn không bị &quot;đóng băng&quot; khi nói: kéo thời gian, xin nhắc lại, BLUF, PREP…
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <CardTitle className="text-base">{c.title_vi}</CardTitle>
              <CardDescription>{c.explanation_vi}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <ul className="space-y-1">
                {c.phrases.map((p) => (
                  <li key={p} className="text-sm">• {p}</li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">Bài tập: {c.drill}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
const TOPIC_EMOJI: Record<string, string> = {
  food: "🍜",
  drink: "🥤",
  travel: "✈️",
  transport: "🚆",
  work: "💼",
  study: "📚",
  education: "🎓",
  family: "👨‍👩‍👧",
  people: "👥",
  health: "🏥",
  body: "🫀",
  weather: "🌦️",
  nature: "🌿",
  animals: "🐾",
  home: "🏠",
  city: "🏙️",
  country: "🌍",
  time: "⏰",
  money: "💰",
  shopping: "🛍️",
  technology: "💻",
  science: "🔬",
  art: "🎨",
  music: "🎵",
  sport: "⚽",
  clothes: "👕",
  emotions: "😊",
};

export function emojiForTopic(topic: string | null): string {
  if (!topic) return "🔤";
  return TOPIC_EMOJI[topic.toLowerCase()] ?? "🔤";
}
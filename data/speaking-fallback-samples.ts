import type { Level } from "@/data/speaking-questions-by-level";

export type FallbackSample = {
  topicId: string;
  level: Level;
  questions: Array<{
    question: string;
    sampleAnswer: string;
    keywords: string[];
  }>;
};

const FALLBACK_SAMPLES: FallbackSample[] = [
  {
    topicId: "daily-routine",
    level: "A2",
    questions: [
      {
        question: "What time do you usually wake up in the morning?",
        sampleAnswer: "I usually wake up at six thirty in the morning.",
        keywords: ["wake up", "six thirty", "morning"],
      },
      {
        question: "What do you usually eat for breakfast?",
        sampleAnswer: "I usually eat bread and eggs for breakfast.",
        keywords: ["bread", "eggs", "breakfast"],
      },
      {
        question: "How do you go to work or school every day?",
        sampleAnswer: "I go to work by bus every day.",
        keywords: ["go to work", "by bus", "every day"],
      },
      {
        question: "What do you do after work or school?",
        sampleAnswer: "After work, I usually go home and cook dinner.",
        keywords: ["after work", "go home", "cook dinner"],
      },
      {
        question: "What time do you usually go to bed?",
        sampleAnswer: "I usually go to bed at ten thirty.",
        keywords: ["go to bed", "ten thirty", "usually"],
      },
    ],
  },
  {
    topicId: "hobbies",
    level: "A2",
    questions: [
      {
        question: "What do you like to do in your free time?",
        sampleAnswer: "In my free time, I like to read books and listen to music.",
        keywords: ["free time", "read books", "listen to music"],
      },
      {
        question: "When did you start this hobby?",
        sampleAnswer: "I started this hobby when I was in high school.",
        keywords: ["started", "high school", "hobby"],
      },
      {
        question: "Why do you enjoy this activity?",
        sampleAnswer: "I enjoy this activity because it helps me relax.",
        keywords: ["enjoy", "because", "relax"],
      },
      {
        question: "Do you do your hobby alone or with other people?",
        sampleAnswer: "I usually do my hobby alone, but sometimes with friends.",
        keywords: ["alone", "sometimes", "friends"],
      },
      {
        question: "How often do you practice your hobby?",
        sampleAnswer: "I practice my hobby three times a week.",
        keywords: ["three times", "a week", "practice"],
      },
    ],
  },
  {
    topicId: "food",
    level: "A2",
    questions: [
      {
        question: "What is your favorite food? Why do you like it?",
        sampleAnswer: "My favorite food is pho because it is warm and delicious.",
        keywords: ["favorite food", "because", "delicious"],
      },
      {
        question: "Do you like cooking? What can you cook?",
        sampleAnswer: "Yes, I like cooking. I can cook fried rice and noodles.",
        keywords: ["like cooking", "fried rice", "noodles"],
      },
      {
        question: "What did you eat for dinner yesterday?",
        sampleAnswer: "Yesterday I ate rice with chicken and vegetables for dinner.",
        keywords: ["yesterday", "rice", "chicken", "vegetables"],
      },
      {
        question: "Do you prefer eating at home or in a restaurant?",
        sampleAnswer: "I prefer eating at home because it is cheaper and healthier.",
        keywords: ["prefer", "at home", "cheaper", "healthier"],
      },
      {
        question: "What is a famous dish from your country?",
        sampleAnswer: "A famous dish from my country is pho.",
        keywords: ["famous dish", "country", "pho"],
      },
    ],
  },
  {
    topicId: "family",
    level: "A2",
    questions: [
      {
        question: "How many people are there in your family?",
        sampleAnswer: "There are four people in my family.",
        keywords: ["four people", "family"],
      },
      {
        question: "Who are you closest to in your family?",
        sampleAnswer: "I am closest to my mother because she understands me.",
        keywords: ["closest", "mother", "understands"],
      },
      {
        question: "What does your father do for work?",
        sampleAnswer: "My father is a teacher. He works at a high school.",
        keywords: ["father", "teacher", "works"],
      },
      {
        question: "Do you have any brothers or sisters?",
        sampleAnswer: "Yes, I have one brother and one sister.",
        keywords: ["brother", "sister", "have"],
      },
      {
        question: "Do you live with your family?",
        sampleAnswer: "Yes, I live with my family in Hanoi.",
        keywords: ["live", "family", "Hanoi"],
      },
    ],
  },
  {
    topicId: "shopping",
    level: "A2",
    questions: [
      {
        question: "Do you like shopping? Why or why not?",
        sampleAnswer: "Yes, I like shopping because it is fun and relaxing.",
        keywords: ["like shopping", "fun", "relaxing"],
      },
      {
        question: "Where do you usually buy clothes?",
        sampleAnswer: "I usually buy clothes at a shopping mall near my house.",
        keywords: ["buy clothes", "shopping mall", "near"],
      },
      {
        question: "What was the last thing you bought?",
        sampleAnswer: "The last thing I bought was a pair of shoes.",
        keywords: ["last thing", "bought", "shoes"],
      },
      {
        question: "Do you prefer shopping online or in stores?",
        sampleAnswer: "I prefer shopping online because it is convenient.",
        keywords: ["prefer", "online", "convenient"],
      },
      {
        question: "What do you want to buy next?",
        sampleAnswer: "I want to buy a new laptop next month.",
        keywords: ["want to buy", "new laptop", "next month"],
      },
    ],
  },
  {
    topicId: "health",
    level: "A2",
    questions: [
      {
        question: "Do you exercise regularly? What kind of exercise?",
        sampleAnswer: "Yes, I exercise regularly. I usually go jogging in the park.",
        keywords: ["exercise", "jogging", "park"],
      },
      {
        question: "How many hours do you sleep every night?",
        sampleAnswer: "I sleep about seven hours every night.",
        keywords: ["seven hours", "sleep", "night"],
      },
      {
        question: "Do you eat healthy food every day?",
        sampleAnswer: "Yes, I try to eat healthy food every day.",
        keywords: ["healthy food", "every day", "eat"],
      },
      {
        question: "Do you drink enough water?",
        sampleAnswer: "Yes, I drink about two liters of water every day.",
        keywords: ["drink", "water", "two liters"],
      },
      {
        question: "How do you stay healthy?",
        sampleAnswer: "I stay healthy by exercising, eating well, and sleeping enough.",
        keywords: ["stay healthy", "exercising", "eating well", "sleeping"],
      },
    ],
  },
  {
    topicId: "weather",
    level: "A2",
    questions: [
      {
        question: "What is the weather like today?",
        sampleAnswer: "Today it is sunny and hot.",
        keywords: ["today", "sunny", "hot"],
      },
      {
        question: "What is your favorite season? Why?",
        sampleAnswer: "My favorite season is autumn because the weather is cool.",
        keywords: ["favorite season", "autumn", "cool"],
      },
      {
        question: "Do you like hot weather or cold weather?",
        sampleAnswer: "I prefer cold weather because I can wear nice clothes.",
        keywords: ["prefer", "cold weather", "wear"],
      },
      {
        question: "What do you usually do on rainy days?",
        sampleAnswer: "On rainy days, I usually stay home and watch movies.",
        keywords: ["rainy days", "stay home", "watch movies"],
      },
      {
        question: "Does it snow in your country?",
        sampleAnswer: "No, it does not snow in my country.",
        keywords: ["snow", "country", "No"],
      },
    ],
  },
  {
    topicId: "housing",
    level: "A2",
    questions: [
      {
        question: "Do you live in a house or an apartment?",
        sampleAnswer: "I live in an apartment with my family.",
        keywords: ["live", "apartment", "family"],
      },
      {
        question: "How many rooms does your home have?",
        sampleAnswer: "My apartment has three rooms.",
        keywords: ["three rooms", "apartment"],
      },
      {
        question: "What is your favorite room in your house?",
        sampleAnswer: "My favorite room is the living room.",
        keywords: ["favorite room", "living room"],
      },
      {
        question: "Do you have a garden or balcony?",
        sampleAnswer: "No, I do not have a garden or balcony.",
        keywords: ["garden", "balcony", "No"],
      },
      {
        question: "Do you like your neighborhood?",
        sampleAnswer: "Yes, I like my neighborhood because it is quiet and safe.",
        keywords: ["like", "neighborhood", "quiet", "safe"],
      },
    ],
  },
  {
    topicId: "transport",
    level: "A2",
    questions: [
      {
        question: "How do you usually go to work or school?",
        sampleAnswer: "I usually go to work by motorbike.",
        keywords: ["usually", "go to work", "motorbike"],
      },
      {
        question: "Do you like using public transport?",
        sampleAnswer: "Yes, I like using public transport because it is cheap.",
        keywords: ["like", "public transport", "cheap"],
      },
      {
        question: "Do you drive a car or ride a motorbike?",
        sampleAnswer: "I ride a motorbike every day.",
        keywords: ["ride", "motorbike", "every day"],
      },
      {
        question: "How long does it take you to get to work?",
        sampleAnswer: "It takes me about twenty minutes to get to work.",
        keywords: ["twenty minutes", "takes", "get to work"],
      },
      {
        question: "Is traffic bad in your city?",
        sampleAnswer: "Yes, traffic is bad in my city during rush hour.",
        keywords: ["traffic", "bad", "rush hour"],
      },
    ],
  },
  {
    topicId: "technology",
    level: "A2",
    questions: [
      {
        question: "Do you use a smartphone every day?",
        sampleAnswer: "Yes, I use my smartphone every day.",
        keywords: ["smartphone", "every day", "use"],
      },
      {
        question: "What apps do you use most often?",
        sampleAnswer: "I use messaging and learning apps most often.",
        keywords: ["apps", "messaging", "learning"],
      },
      {
        question: "Do you like using social media?",
        sampleAnswer: "Yes, I like using social media to connect with friends.",
        keywords: ["like", "social media", "connect", "friends"],
      },
      {
        question: "Do you shop online?",
        sampleAnswer: "Yes, I sometimes shop online when there is a sale.",
        keywords: ["shop online", "sometimes", "sale"],
      },
      {
        question: "Do you watch videos online every day?",
        sampleAnswer: "Yes, I watch videos online every evening.",
        keywords: ["watch videos", "online", "evening"],
      },
    ],
  },
];

export function getFallbackSample(topicId: string, level: Level): FallbackSample | null {
  const match = FALLBACK_SAMPLES.find(
    (s) => s.topicId === topicId && s.level === level,
  );
  if (match) return match;

  const levelMatch = FALLBACK_SAMPLES.find((s) => s.level === level);
  return levelMatch ?? null;
}

export function getFallbackQuestion(
  topicId: string,
  level: Level,
  index: number,
): { question: string; sampleAnswer: string; keywords: string[] } | null {
  const sample = getFallbackSample(topicId, level);
  if (!sample) return null;
  return sample.questions[index % sample.questions.length] ?? null;
}
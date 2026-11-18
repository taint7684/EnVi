export type FallbackTopic = {
  id: string;
  label: string;
  questions: string[];
};

const FALLBACK_QUESTIONS: Record<string, FallbackTopic> = {
  "daily-routine": {
    id: "daily-routine",
    label: "Daily Routine",
    questions: [
      "What time do you usually wake up in the morning?",
      "What do you usually eat for breakfast?",
      "How do you go to work or school every day?",
      "What do you do after work or school?",
      "What time do you usually go to bed?",
      "Do you like your daily routine? Why or why not?",
      "What is your favorite part of the day?",
      "Do you exercise regularly? When?",
      "What do you usually do on weekends?",
      "How do you relax after a long day?",
    ],
  },
  hobbies: {
    id: "hobbies",
    label: "Hobbies",
    questions: [
      "What do you like to do in your free time?",
      "When did you start this hobby?",
      "Why do you enjoy this activity?",
      "Do you do your hobby alone or with other people?",
      "How often do you practice your hobby?",
      "Have you tried any new hobbies recently?",
      "What hobby would you like to try in the future?",
      "Do you think hobbies are important? Why?",
      "How much time do you spend on your hobbies each week?",
      "Who taught you your hobby?",
    ],
  },
  "food-cooking": {
    id: "food-cooking",
    label: "Food & Cooking",
    questions: [
      "What is your favorite food? Why do you like it?",
      "Do you like cooking? What can you cook?",
      "What did you eat for dinner yesterday?",
      "Do you prefer eating at home or in a restaurant?",
      "What is a famous dish from your country?",
      "Do you like spicy food or sweet food?",
      "Who cooks in your family?",
      "What is your favorite drink?",
      "Do you like trying new foods?",
      "What time do you usually have lunch?",
    ],
  },
  family: {
    id: "family",
    label: "Family",
    questions: [
      "How many people are there in your family?",
      "Who are you closest to in your family?",
      "What does your father do for work?",
      "Do you have any brothers or sisters?",
      "Where do your parents live?",
      "Do you live with your family?",
      "What do you usually do with your family on weekends?",
      "Do you look like your mother or your father?",
      "Who is the oldest person in your family?",
      "Do you enjoy spending time with your family?",
    ],
  },
  shopping: {
    id: "shopping",
    label: "Shopping",
    questions: [
      "Do you like shopping? Why or why not?",
      "Where do you usually buy clothes?",
      "What was the last thing you bought?",
      "Do you prefer shopping online or in stores?",
      "How much money do you usually spend on shopping?",
      "Do you like buying shoes?",
      "Do you shop alone or with friends?",
      "What is your favorite shop or mall?",
      "Do you like looking for sales and discounts?",
      "What do you want to buy next?",
    ],
  },
  "health-fitness": {
    id: "health-fitness",
    label: "Health & Fitness",
    questions: [
      "Do you exercise regularly? What kind of exercise?",
      "How many hours do you sleep every night?",
      "Do you eat healthy food every day?",
      "Do you drink enough water?",
      "Do you like going to the gym?",
      "How do you stay healthy?",
      "Do you go for walks often?",
      "Do you like sports? Which sports?",
      "Do you eat a lot of vegetables?",
      "Do you think health is important? Why?",
    ],
  },
  "weather-seasons": {
    id: "weather-seasons",
    label: "Weather & Seasons",
    questions: [
      "What is the weather like today?",
      "What is your favorite season? Why?",
      "Do you like hot weather or cold weather?",
      "What do you usually do on rainy days?",
      "Does it snow in your country?",
      "What is the best season to visit your country?",
      "Do you like sunshine?",
      "What do you wear in winter?",
      "Does the weather affect your mood?",
      "What is the hottest month in your country?",
    ],
  },
  housing: {
    id: "housing",
    label: "Housing",
    questions: [
      "Do you live in a house or an apartment?",
      "How many rooms does your home have?",
      "What is your favorite room in your house?",
      "Do you have a garden or balcony?",
      "Do you own your home or rent it?",
      "What can you see from your window?",
      "Do you like your neighborhood?",
      "Who do you live with?",
      "Would you like to move to a new house?",
      "What furniture do you like most in your home?",
    ],
  },
  transport: {
    id: "transport",
    label: "Transport",
    questions: [
      "How do you usually go to work or school?",
      "Do you like using public transport?",
      "Do you drive a car or ride a motorbike?",
      "How long does it take you to get to work?",
      "Do you like walking?",
      "Have you ever taken a taxi?",
      "Is traffic bad in your city?",
      "Do you like riding a bicycle?",
      "What is your favorite way to travel?",
      "Do you think public transport is cheap?",
    ],
  },
  "everyday-tech": {
    id: "everyday-tech",
    label: "Everyday Tech",
    questions: [
      "Do you use a smartphone every day?",
      "What apps do you use most often?",
      "Do you like using social media?",
      "How many hours do you spend on the internet?",
      "Do you shop online?",
      "Do you play games on your phone?",
      "Do you use a computer for work?",
      "Do you think technology makes life easier?",
      "What is your favorite website?",
      "Do you watch videos online every day?",
    ],
  },
};

const DEFAULT_QUESTIONS = [
  "Tell me about yourself.",
  "What do you do every day?",
  "Where are you from?",
  "What is your favorite hobby?",
  "What do you like about your city?",
  "Do you like traveling? Where do you want to go?",
  "What food do you like most?",
  "Tell me about your family.",
  "What did you do last weekend?",
  "What are your plans for the future?",
];

export function getFallbackTopic(topic: string): FallbackTopic {
  const match = Object.values(FALLBACK_QUESTIONS).find(
    (t) => t.label.toLowerCase() === topic.toLowerCase() || t.id === topic,
  );
  if (match) return match;
  return {
    id: "default",
    label: "General",
    questions: DEFAULT_QUESTIONS,
  };
}

export const FALLBACK_TOPICS = Object.values(FALLBACK_QUESTIONS);

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
  // ─── B1 / B2 for the original A2 topics ───
  {
    topicId: "daily-routine",
    level: "B1",
    questions: [
      { question: "How does your weekend routine differ from your weekday routine?", sampleAnswer: "On weekdays I wake up early for work, but on weekends I sleep in and relax more.", keywords: ["weekday", "weekend", "relax"] },
      { question: "Tell me about a typical day in your life.", sampleAnswer: "I usually wake up at six, go to work, and spend the evening with my family.", keywords: ["typical day", "wake up", "evening"] },
      { question: "What is your favorite time of day? Why?", sampleAnswer: "My favorite time is the evening because I can relax after a busy day.", keywords: ["favorite time", "evening", "relax"] },
      { question: "Do you think it is important to have a daily routine? Why or why not?", sampleAnswer: "Yes, I think a routine helps me stay organized and manage my time better.", keywords: ["routine", "organized", "manage time"] },
      { question: "What would you like to change about your daily routine?", sampleAnswer: "I would like to wake up earlier so I have more time to exercise.", keywords: ["change", "wake up earlier", "exercise"] },
    ],
  },
  {
    topicId: "daily-routine",
    level: "B2",
    questions: [
      { question: "What are the trade-offs between a fixed routine and a flexible one?", sampleAnswer: "A fixed routine gives structure but can feel boring, while a flexible one offers freedom but less discipline.", keywords: ["trade-off", "structure", "freedom"] },
      { question: "How has your daily routine changed over the past five years?", sampleAnswer: "Five years ago I worked in an office; now I work from home with a more flexible schedule.", keywords: ["changed", "office", "remote"] },
      { question: "Do you think morning people are more productive than night owls? Why?", sampleAnswer: "It depends on the person, but morning people often get more done because they have more energy early.", keywords: ["morning people", "night owls", "productive"] },
      { question: "How does technology affect your daily routine?", sampleAnswer: "Technology helps me work faster, but it also distracts me with constant notifications.", keywords: ["technology", "distract", "notifications"] },
      { question: "If you could design your perfect day, what would it look like?", sampleAnswer: "My perfect day would include exercise, focused work, time with family, and quiet reading.", keywords: ["perfect day", "exercise", "family"] },
    ],
  },
  {
    topicId: "hobbies",
    level: "B1",
    questions: [
      { question: "Tell me about a hobby you would like to try in the future.", sampleAnswer: "I would like to try painting because it helps people express their feelings.", keywords: ["hobby", "try", "painting"] },
      { question: "How do hobbies help people relax?", sampleAnswer: "Hobbies help people relax by taking their mind off work and stress.", keywords: ["relax", "stress", "hobbies"] },
      { question: "Do you think expensive hobbies are better than free ones? Why?", sampleAnswer: "No, I don't think expensive hobbies are better; enjoyment matters more than cost.", keywords: ["expensive", "enjoyment", "cost"] },
      { question: "Have you ever given up a hobby? Why?", sampleAnswer: "Yes, I gave up playing the guitar because I didn't have enough time to practice.", keywords: ["gave up", "guitar", "time"] },
      { question: "What hobby is popular in your country?", sampleAnswer: "Football is very popular in my country, and many people play it on weekends.", keywords: ["popular", "football", "country"] },
    ],
  },
  {
    topicId: "hobbies",
    level: "B2",
    questions: [
      { question: "How can hobbies help someone develop new skills for work?", sampleAnswer: "Hobbies like coding or photography teach problem-solving and creativity that are useful at work.", keywords: ["skills", "problem-solving", "work"] },
      { question: "Do you think people spend too much time on hobbies instead of work?", sampleAnswer: "It depends on balance; hobbies are healthy unless they interfere with work and responsibilities.", keywords: ["balance", "interfere", "responsibilities"] },
      { question: "How have hobbies changed with the internet and social media?", sampleAnswer: "The internet lets people share hobbies online and learn from others around the world.", keywords: ["internet", "share", "social media"] },
      { question: "Should children be encouraged to have many different hobbies? Why?", sampleAnswer: "Yes, trying many hobbies helps children discover their interests and talents.", keywords: ["children", "discover", "talents"] },
      { question: "Is it better to have one hobby you master or many hobbies you enjoy?", sampleAnswer: "I think enjoying many hobbies is better for most people because it keeps life interesting.", keywords: ["one hobby", "many hobbies", "enjoy"] },
    ],
  },
  {
    topicId: "food",
    level: "B1",
    questions: [
      { question: "Tell me about a famous dish from your country.", sampleAnswer: "A famous dish from my country is pho, a noodle soup with beef and herbs.", keywords: ["famous dish", "pho", "noodle soup"] },
      { question: "Do you like trying new foods? Why or why not?", sampleAnswer: "Yes, I like trying new foods because it is exciting to discover different flavors.", keywords: ["try new foods", "flavors", "exciting"] },
      { question: "Who cooks in your family?", sampleAnswer: "My mother usually cooks, but I also help at weekends.", keywords: ["cook", "mother", "help"] },
      { question: "Is it important to eat healthy food every day? Why?", sampleAnswer: "Yes, eating healthy food every day gives us energy and prevents illness.", keywords: ["healthy food", "energy", "illness"] },
      { question: "What is the best restaurant you have been to?", sampleAnswer: "The best restaurant I have been to is a small Italian place near my house.", keywords: ["best restaurant", "Italian", "near"] },
    ],
  },
  {
    topicId: "food",
    level: "B2",
    questions: [
      { question: "How does food reflect the culture of a country?", sampleAnswer: "Food reflects culture through ingredients, cooking methods, and traditions passed down over generations.", keywords: ["culture", "ingredients", "traditions"] },
      { question: "Should schools teach children how to cook? Why or why not?", sampleAnswer: "Yes, I think schools should teach cooking because it is a basic life skill that promotes health.", keywords: ["schools", "life skill", "health"] },
      { question: "Is fast food becoming too popular in your country? Why?", sampleAnswer: "Yes, fast food is becoming too popular because it is cheap and convenient, but it is unhealthy.", keywords: ["fast food", "convenient", "unhealthy"] },
      { question: "Do you think organic food is worth the higher price?", sampleAnswer: "It depends on the person, but organic food is worth it if you care about health and the environment.", keywords: ["organic", "worth", "environment"] },
      { question: "How will food production change in the future?", sampleAnswer: "In the future, food production will likely rely more on technology and sustainable farming.", keywords: ["food production", "technology", "sustainable"] },
    ],
  },
  {
    topicId: "family",
    level: "B1",
    questions: [
      { question: "What do you usually do with your family on weekends?", sampleAnswer: "On weekends, we usually have dinner together and visit our grandparents.", keywords: ["weekends", "dinner", "grandparents"] },
      { question: "Do you look like your mother or your father?", sampleAnswer: "I look like my mother; we have the same eyes and smile.", keywords: ["look like", "mother", "smile"] },
      { question: "Who is the oldest person in your family?", sampleAnswer: "My grandfather is the oldest person in my family; he is over eighty.", keywords: ["oldest", "grandfather", "eighty"] },
      { question: "Do you enjoy spending time with your family? Why?", sampleAnswer: "Yes, I enjoy spending time with my family because they support me.", keywords: ["enjoy", "family", "support"] },
      { question: "Is it important to have family dinners together? Why?", sampleAnswer: "Yes, family dinners are important because they help us stay close and talk.", keywords: ["family dinners", "close", "talk"] },
    ],
  },
  {
    topicId: "family",
    level: "B2",
    questions: [
      { question: "How has the concept of family changed in your country?", sampleAnswer: "Families in my country are smaller now than before, with fewer children and more working parents.", keywords: ["concept of family", "smaller", "working parents"] },
      { question: "Should elderly parents live with their children or separately?", sampleAnswer: "I think elderly parents should live near their children but keep their independence if possible.", keywords: ["elderly", "independence", "children"] },
      { question: "How do family expectations affect career choices?", sampleAnswer: "Family expectations often push young people toward stable jobs, which can limit their choices.", keywords: ["expectations", "career", "stable jobs"] },
      { question: "Is it better to grow up in a big family or a small family?", sampleAnswer: "Both have advantages; a big family offers support, while a small family gives more attention.", keywords: ["big family", "small family", "support"] },
      { question: "What role do grandparents play in modern families?", sampleAnswer: "Grandparents often help care for children and pass on traditions in modern families.", keywords: ["grandparents", "care", "traditions"] },
    ],
  },
  {
    topicId: "shopping",
    level: "B1",
    questions: [
      { question: "How much money do you usually spend on shopping?", sampleAnswer: "I usually spend about two million dong a month on clothes and daily items.", keywords: ["spend", "month", "clothes"] },
      { question: "Do you like looking for sales and discounts?", sampleAnswer: "Yes, I like looking for sales because I can save money.", keywords: ["sales", "discounts", "save money"] },
      { question: "What is your favorite shop or mall?", sampleAnswer: "My favorite mall is the one near my house because it has many shops.", keywords: ["favorite mall", "near", "shops"] },
      { question: "Do you shop alone or with friends?", sampleAnswer: "I usually shop with friends because it is more fun.", keywords: ["shop alone", "friends", "fun"] },
      { question: "Is it easy to find good products in your city?", sampleAnswer: "Yes, it is easy to find good products in my city because there are many stores.", keywords: ["easy", "products", "stores"] },
    ],
  },
  {
    topicId: "shopping",
    level: "B2",
    questions: [
      { question: "How has online shopping changed the way people buy things?", sampleAnswer: "Online shopping is convenient and lets people compare prices, but it reduces face-to-face contact.", keywords: ["online shopping", "compare prices", "convenient"] },
      { question: "Should people buy fewer things to protect the environment?", sampleAnswer: "Yes, buying fewer things would reduce waste and help protect the environment.", keywords: ["buy fewer", "waste", "environment"] },
      { question: "Is it better to shop at local stores or big supermarkets?", sampleAnswer: "Local stores support the community, while supermarkets offer lower prices and more choice.", keywords: ["local stores", "supermarkets", "community"] },
      { question: "How does advertising affect what people buy?", sampleAnswer: "Advertising makes people want products they may not need by showing an attractive lifestyle.", keywords: ["advertising", "want", "lifestyle"] },
      { question: "Will physical stores disappear in the future?", sampleAnswer: "I don't think physical stores will disappear, but they will become more experience-focused.", keywords: ["physical stores", "disappear", "experience"] },
    ],
  },
  {
    topicId: "health",
    level: "B1",
    questions: [
      { question: "How do you stay healthy?", sampleAnswer: "I stay healthy by eating well, exercising, and sleeping enough.", keywords: ["stay healthy", "eat well", "exercise"] },
      { question: "Do you go for walks often?", sampleAnswer: "Yes, I go for walks in the park almost every evening.", keywords: ["walks", "park", "evening"] },
      { question: "Do you like sports? Which sports?", sampleAnswer: "Yes, I like playing football and swimming.", keywords: ["sports", "football", "swimming"] },
      { question: "Do you eat a lot of vegetables?", sampleAnswer: "Yes, I eat vegetables every day because they are good for me.", keywords: ["vegetables", "every day", "healthy"] },
      { question: "Do you think health is important? Why?", sampleAnswer: "Yes, health is important because without it we cannot enjoy life.", keywords: ["health", "important", "enjoy life"] },
    ],
  },
  {
    topicId: "health",
    level: "B2",
    questions: [
      { question: "Should governments do more to promote public health?", sampleAnswer: "Yes, governments should promote public health through education, parks, and healthcare.", keywords: ["governments", "public health", "education"] },
      { question: "Is it harder to stay healthy in cities than in villages?", sampleAnswer: "It can be harder in cities because of pollution and fast lifestyles, but there are more gyms too.", keywords: ["cities", "villages", "pollution"] },
      { question: "How does stress affect people's health in your country?", sampleAnswer: "Stress causes many health problems in my country, such as poor sleep and anxiety.", keywords: ["stress", "health problems", "anxiety"] },
      { question: "Should unhealthy food be taxed more?", sampleAnswer: "Taxing unhealthy food could reduce consumption, but it may also hurt poor families.", keywords: ["tax", "unhealthy food", "consumption"] },
      { question: "What is the best way to encourage people to exercise?", sampleAnswer: "The best way is to make exercise fun and accessible, like free classes and safe parks.", keywords: ["encourage", "fun", "accessible"] },
    ],
  },
  {
    topicId: "weather",
    level: "B1",
    questions: [
      { question: "What is the best season to visit your country?", sampleAnswer: "The best season to visit my country is autumn because the weather is cool.", keywords: ["best season", "autumn", "cool"] },
      { question: "Do you like sunshine?", sampleAnswer: "Yes, I like sunshine because it makes me feel happy and energetic.", keywords: ["sunshine", "happy", "energetic"] },
      { question: "What do you wear in winter?", sampleAnswer: "In winter, I wear a warm coat, a scarf, and gloves.", keywords: ["winter", "coat", "scarf"] },
      { question: "Does the weather affect your mood?", sampleAnswer: "Yes, sunny weather makes me cheerful, while rainy days make me sleepy.", keywords: ["weather", "mood", "cheerful"] },
      { question: "What is the hottest month in your country?", sampleAnswer: "The hottest month in my country is usually June or July.", keywords: ["hottest month", "June", "July"] },
    ],
  },
  {
    topicId: "weather",
    level: "B2",
    questions: [
      { question: "How is climate change affecting weather in your country?", sampleAnswer: "Climate change is causing hotter summers, stronger storms, and unpredictable rain in my country.", keywords: ["climate change", "storms", "unpredictable"] },
      { question: "Should people change their lifestyle because of climate change?", sampleAnswer: "Yes, people should change their lifestyle, for example by using less energy and reducing waste.", keywords: ["lifestyle", "climate change", "energy"] },
      { question: "How does weather affect the economy of your country?", sampleAnswer: "Weather affects the economy through farming, tourism, and energy costs.", keywords: ["weather", "economy", "farming"] },
      { question: "Is it better to live in a place with four seasons or one season?", sampleAnswer: "I prefer four seasons because each season has its own beauty and activities.", keywords: ["four seasons", "beauty", "activities"] },
      { question: "What can individuals do to help the environment?", sampleAnswer: "Individuals can help by recycling, saving energy, and using public transport.", keywords: ["individuals", "recycling", "public transport"] },
    ],
  },
  {
    topicId: "housing",
    level: "B1",
    questions: [
      { question: "What can you see from your window?", sampleAnswer: "From my window, I can see a busy street and some trees.", keywords: ["window", "street", "trees"] },
      { question: "Do you like your neighborhood?", sampleAnswer: "Yes, I like my neighborhood because it is quiet and safe.", keywords: ["neighborhood", "quiet", "safe"] },
      { question: "Who do you live with?", sampleAnswer: "I live with my parents and my younger sister.", keywords: ["live with", "parents", "sister"] },
      { question: "Would you like to move to a new house?", sampleAnswer: "Yes, I would like to move to a bigger house with a garden.", keywords: ["move", "bigger house", "garden"] },
      { question: "What furniture do you like most in your home?", sampleAnswer: "I like my bookshelf most because I keep all my favorite books there.", keywords: ["furniture", "bookshelf", "books"] },
    ],
  },
  {
    topicId: "housing",
    level: "B2",
    questions: [
      { question: "Is it better to rent or buy a home? Why?", sampleAnswer: "Buying is better long-term because you own an asset, but renting offers flexibility.", keywords: ["rent", "buy", "asset"] },
      { question: "How has housing changed in your city over the past decade?", sampleAnswer: "Housing in my city has become much more expensive, with many new apartments built.", keywords: ["housing", "expensive", "apartments"] },
      { question: "Should governments provide affordable housing for everyone?", sampleAnswer: "Yes, affordable housing helps reduce inequality and gives everyone a safe place to live.", keywords: ["affordable housing", "inequality", "safe"] },
      { question: "What makes a neighborhood a good place to live?", sampleAnswer: "Safety, good transport, schools, and friendly neighbors make a neighborhood a good place to live.", keywords: ["neighborhood", "safety", "neighbors"] },
      { question: "Will people live in smaller homes in the future?", sampleAnswer: "I think people will live in smaller, more efficient homes because of space and cost.", keywords: ["smaller homes", "efficient", "space"] },
    ],
  },
  {
    topicId: "transport",
    level: "B1",
    questions: [
      { question: "Have you ever taken a taxi?", sampleAnswer: "Yes, I have taken a taxi several times when I was in a hurry.", keywords: ["taxi", "several times", "hurry"] },
      { question: "Is traffic bad in your city?", sampleAnswer: "Yes, traffic is very bad in my city during rush hour.", keywords: ["traffic", "bad", "rush hour"] },
      { question: "Do you like riding a bicycle?", sampleAnswer: "Yes, I like riding a bicycle because it is healthy and cheap.", keywords: ["bicycle", "healthy", "cheap"] },
      { question: "What is your favorite way to travel?", sampleAnswer: "My favorite way to travel is by train because it is comfortable.", keywords: ["favorite way", "train", "comfortable"] },
      { question: "Do you think public transport is cheap?", sampleAnswer: "Yes, I think public transport is quite cheap compared to driving.", keywords: ["public transport", "cheap", "driving"] },
    ],
  },
  {
    topicId: "transport",
    level: "B2",
    questions: [
      { question: "Should governments encourage people to use public transport more?", sampleAnswer: "Yes, public transport reduces traffic and pollution, so governments should encourage it.", keywords: ["governments", "public transport", "pollution"] },
      { question: "How will transportation change in the future?", sampleAnswer: "In the future, transportation will likely be electric and self-driving.", keywords: ["transportation", "electric", "self-driving"] },
      { question: "Is it better to have a car or use public transport in a big city?", sampleAnswer: "In a big city, public transport is often better because of traffic and parking problems.", keywords: ["car", "public transport", "parking"] },
      { question: "What are the environmental effects of too many cars?", sampleAnswer: "Too many cars cause air pollution, noise, and traffic jams.", keywords: ["cars", "air pollution", "traffic jams"] },
      { question: "Should cities ban cars from the center?", sampleAnswer: "Banning cars from city centers can improve air quality, but it needs good public transport.", keywords: ["ban cars", "air quality", "city center"] },
    ],
  },
  {
    topicId: "technology",
    level: "B1",
    questions: [
      { question: "Do you play games on your phone?", sampleAnswer: "Yes, I sometimes play games on my phone to relax.", keywords: ["games", "phone", "relax"] },
      { question: "Do you use a computer for work?", sampleAnswer: "Yes, I use a computer every day for work and study.", keywords: ["computer", "work", "study"] },
      { question: "Do you think technology makes life easier?", sampleAnswer: "Yes, technology makes life easier by saving time and connecting people.", keywords: ["technology", "easier", "connect"] },
      { question: "What is your favorite website?", sampleAnswer: "My favorite website is YouTube because I can learn many things there.", keywords: ["favorite website", "YouTube", "learn"] },
      { question: "Do you watch videos online every day?", sampleAnswer: "Yes, I watch videos online almost every day.", keywords: ["videos", "online", "every day"] },
    ],
  },
  {
    topicId: "technology",
    level: "B2",
    questions: [
      { question: "How has technology changed the way people communicate?", sampleAnswer: "Technology lets people communicate instantly across the world through messages and video calls.", keywords: ["technology", "communicate", "instantly"] },
      { question: "Should there be limits on screen time for children?", sampleAnswer: "Yes, limits on screen time help children develop healthy habits and focus on studies.", keywords: ["screen time", "children", "healthy habits"] },
      { question: "Do you think artificial intelligence will replace many jobs?", sampleAnswer: "AI will replace some jobs, but it will also create new ones that need human skills.", keywords: ["AI", "jobs", "human skills"] },
      { question: "Is it important to understand how technology works?", sampleAnswer: "Yes, understanding technology helps us use it safely and make better decisions.", keywords: ["understand", "safely", "decisions"] },
      { question: "How can we protect our privacy online?", sampleAnswer: "We can protect our privacy by using strong passwords and sharing less personal information.", keywords: ["privacy", "passwords", "personal information"] },
    ],
  },
  // ─── IT / workplace cluster (A2 + B1 + B2) ───
  {
    topicId: "work",
    level: "A2",
    questions: [
      { question: "What do you do for work?", sampleAnswer: "I work as a developer at a software company.", keywords: ["work", "developer", "software"] },
      { question: "Where do you work?", sampleAnswer: "I work in a small office in the city center.", keywords: ["office", "city center", "work"] },
      { question: "Do you like your job? Why?", sampleAnswer: "Yes, I like my job because it is interesting and I learn new things.", keywords: ["like", "interesting", "learn"] },
      { question: "What time do you start work?", sampleAnswer: "I start work at eight in the morning.", keywords: ["start work", "eight", "morning"] },
      { question: "Do you work with other people?", sampleAnswer: "Yes, I work with a team of five people.", keywords: ["team", "five people", "work"] },
    ],
  },
  {
    topicId: "work",
    level: "B1",
    questions: [
      { question: "Tell me about your colleagues.", sampleAnswer: "My colleagues are friendly and helpful, and we often have lunch together.", keywords: ["colleagues", "friendly", "lunch"] },
      { question: "What is a typical day at work like?", sampleAnswer: "I usually check emails, join meetings, and work on my tasks.", keywords: ["typical day", "emails", "meetings"] },
      { question: "Do you prefer working alone or in a team?", sampleAnswer: "I prefer working in a team because we can share ideas and solve problems faster.", keywords: ["alone", "team", "share ideas"] },
      { question: "What skills are important for your job?", sampleAnswer: "Communication, problem-solving, and technical skills are important for my job.", keywords: ["skills", "communication", "problem-solving"] },
      { question: "Would you like to change your job? Why?", sampleAnswer: "No, I like my job, but I would like to learn more skills.", keywords: ["change job", "learn", "skills"] },
    ],
  },
  {
    topicId: "work",
    level: "B2",
    questions: [
      { question: "How can companies make employees happier at work?", sampleAnswer: "Companies can make employees happier by offering fair pay, flexible hours, and recognition.", keywords: ["companies", "fair pay", "recognition"] },
      { question: "Is it better to work for a big company or a small company?", sampleAnswer: "Big companies offer stability, while small companies offer more responsibility and a family feeling.", keywords: ["big company", "small company", "stability"] },
      { question: "How has remote work changed the workplace?", sampleAnswer: "Remote work has made the workplace more flexible and reduced commuting.", keywords: ["remote work", "flexible", "commuting"] },
      { question: "Should employees work four days a week instead of five?", sampleAnswer: "A four-day week could improve well-being, but it depends on the job and workload.", keywords: ["four days", "well-being", "workload"] },
      { question: "What qualities make a good manager?", sampleAnswer: "A good manager is fair, communicates clearly, and supports the team.", keywords: ["manager", "fair", "communicate"] },
    ],
  },
  {
    topicId: "job-interview",
    level: "A2",
    questions: [
      { question: "Why do you want this job?", sampleAnswer: "I want this job because it matches my skills and I can grow here.", keywords: ["want this job", "skills", "grow"] },
      { question: "What are your strengths?", sampleAnswer: "My strengths are that I work hard and learn quickly.", keywords: ["strengths", "work hard", "learn quickly"] },
      { question: "What are your weaknesses?", sampleAnswer: "My weakness is that I am sometimes too shy to speak in meetings.", keywords: ["weakness", "shy", "meetings"] },
      { question: "Where do you see yourself in five years?", sampleAnswer: "In five years, I hope to be a senior developer leading a team.", keywords: ["five years", "senior developer", "team"] },
      { question: "Why should we hire you?", sampleAnswer: "You should hire me because I am motivated and I always finish my work on time.", keywords: ["hire", "motivated", "on time"] },
    ],
  },
  {
    topicId: "job-interview",
    level: "B1",
    questions: [
      { question: "Tell me about a challenge you faced at work.", sampleAnswer: "I once had a tight deadline, so I planned my tasks and worked overtime to finish.", keywords: ["challenge", "deadline", "planned"] },
      { question: "How do you handle stress?", sampleAnswer: "I handle stress by staying calm, making a list, and focusing on one task at a time.", keywords: ["stress", "calm", "focus"] },
      { question: "Why did you leave your last job?", sampleAnswer: "I left my last job because I wanted new challenges and to grow my skills.", keywords: ["leave", "challenges", "grow"] },
      { question: "What salary do you expect?", sampleAnswer: "I expect a salary that matches my experience and the market rate.", keywords: ["salary", "experience", "market rate"] },
      { question: "Do you have any questions for us?", sampleAnswer: "Yes, I would like to know more about the team and training opportunities.", keywords: ["questions", "team", "training"] },
    ],
  },
  {
    topicId: "job-interview",
    level: "B2",
    questions: [
      { question: "How do you handle conflict with a colleague?", sampleAnswer: "I stay calm, listen to their view, and try to find a solution together.", keywords: ["conflict", "listen", "solution"] },
      { question: "Describe a time you made a difficult decision.", sampleAnswer: "I once chose to change a project plan because the first approach was not working.", keywords: ["difficult decision", "change", "approach"] },
      { question: "How do you prioritize tasks when everything is urgent?", sampleAnswer: "I prioritize tasks by impact and deadline, then focus on the most important one first.", keywords: ["prioritize", "impact", "deadline"] },
      { question: "What would you do in your first 90 days?", sampleAnswer: "In my first 90 days, I would learn the systems, meet the team, and deliver small wins.", keywords: ["first 90 days", "learn", "small wins"] },
      { question: "Why are you the best candidate for this position?", sampleAnswer: "I am the best candidate because I have the right skills, experience, and attitude.", keywords: ["best candidate", "skills", "attitude"] },
    ],
  },
  {
    topicId: "it-support",
    level: "A2",
    questions: [
      { question: "Do you work in IT support?", sampleAnswer: "Yes, I work in IT support and help users with technical issues.", keywords: ["IT support", "help", "technical issues"] },
      { question: "What do you do when your computer has a problem?", sampleAnswer: "When my computer has a problem, I restart it and check the error message.", keywords: ["computer", "restart", "error"] },
      { question: "Do you help colleagues with technical issues?", sampleAnswer: "Yes, I often help my colleagues with software and hardware problems.", keywords: ["help", "colleagues", "software"] },
      { question: "How do you describe a technical problem?", sampleAnswer: "I describe a technical problem by saying what happened and when it started.", keywords: ["describe", "happened", "started"] },
      { question: "Do you like solving technical problems?", sampleAnswer: "Yes, I like solving technical problems because it is challenging.", keywords: ["solving", "challenging", "problems"] },
    ],
  },
  {
    topicId: "it-support",
    level: "B1",
    questions: [
      { question: "How do you troubleshoot a computer issue?", sampleAnswer: "I start by checking the basics, then I test and narrow down the cause.", keywords: ["troubleshoot", "basics", "cause"] },
      { question: "What information do you need to solve a support ticket?", sampleAnswer: "I need the error message, device details, and steps to reproduce the issue.", keywords: ["information", "error", "reproduce"] },
      { question: "How do you explain a technical problem to a non-technical person?", sampleAnswer: "I use simple words and examples instead of technical terms.", keywords: ["explain", "simple words", "examples"] },
      { question: "What is the most common IT issue at work?", sampleAnswer: "The most common issue is a forgotten password or a slow computer.", keywords: ["common issue", "password", "slow computer"] },
      { question: "How do you prioritize support requests?", sampleAnswer: "I prioritize requests by urgency and how many people are affected.", keywords: ["prioritize", "urgency", "affected"] },
    ],
  },
  {
    topicId: "it-support",
    level: "B2",
    questions: [
      { question: "How can IT support teams improve customer satisfaction?", sampleAnswer: "IT support can improve satisfaction by responding quickly and communicating clearly.", keywords: ["customer satisfaction", "respond quickly", "communicate"] },
      { question: "Should companies invest more in self-service support tools?", sampleAnswer: "Yes, self-service tools reduce the workload and let users solve simple problems themselves.", keywords: ["self-service", "workload", "tools"] },
      { question: "How do you handle an angry customer with a technical problem?", sampleAnswer: "I listen calmly, apologize for the problem, and focus on fixing it.", keywords: ["angry customer", "listen", "fix"] },
      { question: "What skills does a good IT support person need?", sampleAnswer: "A good IT support person needs patience, communication skills, and technical knowledge.", keywords: ["skills", "patience", "technical knowledge"] },
      { question: "How has remote work changed IT support?", sampleAnswer: "Remote work means IT support now solves many problems over the phone or chat instead of in person.", keywords: ["remote work", "phone", "chat"] },
    ],
  },
  {
    topicId: "coding",
    level: "A2",
    questions: [
      { question: "Do you write code?", sampleAnswer: "Yes, I write code almost every day for work.", keywords: ["write code", "every day", "work"] },
      { question: "What programming languages do you know?", sampleAnswer: "I know JavaScript, Python, and a little TypeScript.", keywords: ["languages", "JavaScript", "Python"] },
      { question: "Do you like coding?", sampleAnswer: "Yes, I like coding because I can build useful things.", keywords: ["like coding", "build", "useful"] },
      { question: "How do you learn new programming skills?", sampleAnswer: "I learn new skills by taking online courses and practicing small projects.", keywords: ["learn", "online courses", "practice"] },
      { question: "Do you work on a development team?", sampleAnswer: "Yes, I work on a development team of five people.", keywords: ["development team", "five people", "work"] },
    ],
  },
  {
    topicId: "coding",
    level: "B1",
    questions: [
      { question: "What is your favorite programming language? Why?", sampleAnswer: "My favorite language is TypeScript because it helps me catch errors early.", keywords: ["favorite language", "TypeScript", "errors"] },
      { question: "How do you debug a problem in your code?", sampleAnswer: "I debug by reading the error message, checking the logic, and testing small parts.", keywords: ["debug", "error", "logic"] },
      { question: "What is a code review?", sampleAnswer: "A code review is when another developer checks your code before it is merged.", keywords: ["code review", "developer", "merged"] },
      { question: "How do you keep your code clean and readable?", sampleAnswer: "I keep my code clean by using clear names, small functions, and comments.", keywords: ["clean code", "names", "comments"] },
      { question: "What is the difference between frontend and backend?", sampleAnswer: "Frontend is what users see, while backend handles data and logic.", keywords: ["frontend", "backend", "data"] },
    ],
  },
  {
    topicId: "coding",
    level: "B2",
    questions: [
      { question: "How do you balance technical debt and new features?", sampleAnswer: "I balance technical debt by fixing critical issues first and scheduling small improvements.", keywords: ["technical debt", "features", "critical issues"] },
      { question: "What makes code maintainable in the long term?", sampleAnswer: "Maintainable code is simple, well-tested, and documented.", keywords: ["maintainable", "tested", "documented"] },
      { question: "How has artificial intelligence changed the way developers write code?", sampleAnswer: "AI tools help developers write code faster, but humans must review and test it.", keywords: ["AI", "write code", "review"] },
      { question: "Should developers write tests before or after the code?", sampleAnswer: "Tests should ideally be written before or during development to catch bugs early.", keywords: ["tests", "development", "bugs"] },
      { question: "How do you handle disagreements about technical decisions in a team?", sampleAnswer: "I handle disagreements by listening to each view and choosing the option that best fits the goal.", keywords: ["disagreements", "listen", "goal"] },
    ],
  },
  {
    topicId: "remote-work",
    level: "A2",
    questions: [
      { question: "Do you work from home or in an office?", sampleAnswer: "I work from home three days a week and go to the office two days.", keywords: ["work from home", "office", "three days"] },
      { question: "Do you like working from home?", sampleAnswer: "Yes, I like working from home because I save time on commuting.", keywords: ["like", "work from home", "commuting"] },
      { question: "What tools do you use for online meetings?", sampleAnswer: "I use Zoom and Google Meet for online meetings.", keywords: ["tools", "Zoom", "Google Meet"] },
      { question: "How do you stay focused at home?", sampleAnswer: "I stay focused by making a schedule and taking short breaks.", keywords: ["focused", "schedule", "breaks"] },
      { question: "Do you miss working with your team?", sampleAnswer: "Sometimes I miss working with my team face to face.", keywords: ["miss", "team", "face to face"] },
    ],
  },
  {
    topicId: "remote-work",
    level: "B1",
    questions: [
      { question: "What are the advantages of working from home?", sampleAnswer: "The main advantages are saving time, less stress, and a flexible schedule.", keywords: ["advantages", "save time", "flexible"] },
      { question: "How do you separate work and personal life at home?", sampleAnswer: "I set a clear working time and stop working after a fixed hour.", keywords: ["separate", "working time", "personal life"] },
      { question: "Do you think remote work is productive?", sampleAnswer: "Yes, I think remote work is productive if you have a good routine.", keywords: ["remote work", "productive", "routine"] },
      { question: "What problems can happen in remote work?", sampleAnswer: "Problems can include feeling lonely, distractions, and poor internet.", keywords: ["problems", "lonely", "internet"] },
      { question: "How do you communicate with your team when remote?", sampleAnswer: "I communicate with my team through chat, calls, and regular meetings.", keywords: ["communicate", "chat", "meetings"] },
    ],
  },
  {
    topicId: "remote-work",
    level: "B2",
    questions: [
      { question: "Is remote work better than office work for productivity?", sampleAnswer: "Remote work can be better for focused tasks, while office work is better for collaboration.", keywords: ["remote work", "office work", "productivity"] },
      { question: "How can companies keep remote employees engaged?", sampleAnswer: "Companies can keep employees engaged with clear goals, feedback, and social activities.", keywords: ["engaged", "goals", "feedback"] },
      { question: "What are the long-term effects of remote work on society?", sampleAnswer: "Remote work may reduce commuting and office costs, but it can also increase isolation.", keywords: ["long-term", "commuting", "isolation"] },
      { question: "Should employees have the right to work remotely?", sampleAnswer: "Employees should have the right to work remotely if their job allows it and they stay productive.", keywords: ["right", "remotely", "productive"] },
      { question: "How do you build team culture in a remote company?", sampleAnswer: "Team culture in a remote company needs regular check-ins and shared values.", keywords: ["team culture", "check-ins", "values"] },
    ],
  },
  {
    topicId: "business-english",
    level: "A2",
    questions: [
      { question: "Do you use English at work?", sampleAnswer: "Yes, I use English at work to communicate with clients.", keywords: ["English", "work", "clients"] },
      { question: "Do you write business emails in English?", sampleAnswer: "Yes, I write business emails in English every day.", keywords: ["business emails", "English", "every day"] },
      { question: "Do you attend meetings in English?", sampleAnswer: "Yes, I attend meetings in English with my team.", keywords: ["meetings", "English", "team"] },
      { question: "What business words do you know?", sampleAnswer: "I know words like meeting, deadline, report, and client.", keywords: ["business words", "meeting", "deadline"] },
      { question: "Do you feel confident speaking English at work?", sampleAnswer: "Sometimes I feel nervous, but I am more confident now.", keywords: ["confident", "nervous", "English"] },
    ],
  },
  {
    topicId: "business-english",
    level: "B1",
    questions: [
      { question: "How do you negotiate with a client in English?", sampleAnswer: "I listen to the client, explain my offer clearly, and find a solution together.", keywords: ["negotiate", "offer", "solution"] },
      { question: "What phrases do you use to sound polite in business?", sampleAnswer: "I use phrases like 'Could you please' and 'I would appreciate it'.", keywords: ["polite", "phrases", "please"] },
      { question: "How do you disagree politely in a meeting?", sampleAnswer: "I say 'I see your point, but I have a different view' to disagree politely.", keywords: ["disagree", "politely", "meeting"] },
      { question: "What is the difference between formal and informal business English?", sampleAnswer: "Formal English is more polite and structured, while informal English is more relaxed.", keywords: ["formal", "informal", "business English"] },
      { question: "How do you close a deal in English?", sampleAnswer: "I close a deal by confirming the details and thanking the client for their trust.", keywords: ["close a deal", "confirm", "thank"] },
    ],
  },
  {
    topicId: "business-english",
    level: "B2",
    questions: [
      { question: "How can non-native speakers improve their business English?", sampleAnswer: "Non-native speakers can improve by practicing daily and learning common business phrases.", keywords: ["non-native", "practice", "business phrases"] },
      { question: "Is it fair that English is the global language of business?", sampleAnswer: "English as a global language is practical, but it can be unfair to non-native speakers.", keywords: ["global language", "fair", "practical"] },
      { question: "How do you handle a difficult negotiation in a foreign language?", sampleAnswer: "I prepare my key points in advance and speak slowly and clearly.", keywords: ["negotiation", "prepare", "clearly"] },
      { question: "What are the most important business English skills for an IT professional?", sampleAnswer: "IT professionals need clear writing, presentation, and meeting skills.", keywords: ["IT professional", "writing", "presentation"] },
      { question: "How has remote work changed business communication in English?", sampleAnswer: "Remote work has increased written English communication through email and chat.", keywords: ["remote work", "written English", "email"] },
    ],
  },
  // ─── Travel ───
  {
    topicId: "travel",
    level: "A2",
    questions: [
      { question: "Do you like traveling?", sampleAnswer: "Yes, I love traveling because I can see new places.", keywords: ["traveling", "new places", "love"] },
      { question: "Where did you go on your last trip?", sampleAnswer: "On my last trip, I went to Da Nang with my family.", keywords: ["last trip", "Da Nang", "family"] },
      { question: "Do you prefer traveling alone or with others?", sampleAnswer: "I prefer traveling with others because it is more fun.", keywords: ["alone", "others", "fun"] },
      { question: "What do you take with you when you travel?", sampleAnswer: "I take clothes, a passport, and a camera.", keywords: ["take", "clothes", "passport"] },
      { question: "Have you ever traveled by plane?", sampleAnswer: "Yes, I have traveled by plane several times.", keywords: ["plane", "several times", "traveled"] },
    ],
  },
  {
    topicId: "travel",
    level: "B1",
    questions: [
      { question: "Tell me about a memorable trip you took.", sampleAnswer: "I once went to Ha Long Bay and saw beautiful islands; it was unforgettable.", keywords: ["memorable trip", "Ha Long Bay", "islands"] },
      { question: "Do you prefer beach holidays or city trips?", sampleAnswer: "I prefer beach holidays because I can relax by the sea.", keywords: ["beach holidays", "city trips", "relax"] },
      { question: "How do you plan a trip?", sampleAnswer: "I choose a place, book a hotel, and make a list of things to do.", keywords: ["plan a trip", "book", "list"] },
      { question: "What is the best way to save money when traveling?", sampleAnswer: "Traveling in the low season and booking early saves money.", keywords: ["save money", "low season", "booking early"] },
      { question: "What problems can happen when you travel abroad?", sampleAnswer: "Problems can include lost luggage, language barriers, and getting sick.", keywords: ["problems", "lost luggage", "language barriers"] },
    ],
  },
  {
    topicId: "travel",
    level: "B2",
    questions: [
      { question: "How has tourism changed in the last ten years?", sampleAnswer: "Tourism has grown with cheap flights and online booking, but it has also caused overtourism.", keywords: ["tourism", "cheap flights", "overtourism"] },
      { question: "Should governments limit the number of tourists?", sampleAnswer: "Limiting tourists can protect nature and local life, but it may hurt the economy.", keywords: ["governments", "limit tourists", "economy"] },
      { question: "Is it better to travel independently or with a tour group?", sampleAnswer: "Independent travel offers freedom, while tour groups are easier and safer.", keywords: ["independent", "tour group", "freedom"] },
      { question: "How does travel help people understand other cultures?", sampleAnswer: "Travel lets people experience customs and food directly, which builds understanding.", keywords: ["travel", "cultures", "understanding"] },
      { question: "How will travel change in the future?", sampleAnswer: "Travel will likely become more sustainable and technology-driven.", keywords: ["travel", "sustainable", "technology"] },
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
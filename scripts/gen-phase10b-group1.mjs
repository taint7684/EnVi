// Phase 10 (expanded) Group 1 generator:
// - data/dictation-lessons.json  -> 200 lessons (70 A2, 70 B1, 60 B2)
// - data/shadowing-lessons.json  -> 50 lessons (keeps existing 30 + adds 20)
import { readFileSync, writeFileSync } from "node:fs";

const YT = "dQw4w9WgXcQ";

/* ============================ DICTATION ============================ */
const NAMES = ["Anna", "David", "Maria", "John", "Lucy", "Tom", "Sarah", "Mike", "Emma", "Peter", "Nina", "Sam", "Kate", "Ben"];
const CITIES = ["London", "Paris", "Tokyo", "Sydney", "Toronto", "Berlin", "Rome", "Seoul"];
const NUM = [5, 10, 12, 15, 20, 25, 30];
const PRICE = [3, 4, 5, 6, 7, 8, 9];
const FOODS = ["chicken", "fish", "beef", "pork", "rice", "pasta", "soup", "salad"];
const DRINKS = ["coffee", "tea", "juice", "water", "lemonade", "hot chocolate"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Each builder: (v) => transcript string
const A2_BUILDERS = [
  (v) => `I would like a ${DRINKS[v % DRINKS.length]} and a sandwich, please. The total comes to ${PRICE[v % PRICE.length]} dollars. Thank you very much.`,
  (v) => `Excuse me, how do I get to the ${CITIES[v % CITIES.length]} station? Go straight and turn left at the traffic light. It is about ${NUM[v % NUM.length]} minutes away.`,
  (v) => `I am looking for a ${["blue", "red", "black", "white"][v % 4]} shirt in medium size. How much does it cost? Is there a discount today?`,
  (v) => `Good evening. I have a reservation for two nights under the name ${NAMES[v % NAMES.length]}. Does the room include breakfast?`,
  (v) => `I have a headache and a sore throat since yesterday. The doctor says I should rest and drink plenty of water for ${NUM[v % NUM.length]} days.`,
  (v) => `Hello, may I speak to ${NAMES[v % NAMES.length]}, please? I am sorry, he is not here right now. Could I leave a message?`,
  (v) => `Tomorrow will be sunny with a high of ${20 + v} degrees. In the evening there is a chance of rain, so take an umbrella with you.`,
  (v) => `Your flight to ${CITIES[v % CITIES.length]} has been delayed by one hour. Please go to gate ${NUM[v % NUM.length] + 10} for boarding.`,
  (v) => `I would like to book a table for ${NUM[v % NUM.length] / 5 + 1} people at seven o'clock. Could we sit near the window, please?`,
  (v) => `I need some ${FOODS[v % FOODS.length]}, ${DRINKS[v % DRINKS.length]}, and bread. The bill comes to ${PRICE[v % PRICE.length] * 2} dollars, please.`,
  (v) => `Take me to ${CITIES[v % CITIES.length]} airport, please. How long does it take? It is about ${NUM[v % NUM.length] * 2} minutes from here.`,
  (v) => `I want to borrow these two books. When are they due back? They are due in two weeks, and you can renew them online.`,
  (v) => `I would like to send this letter to ${CITIES[v % CITIES.length]}. How much is the stamp? It costs ${PRICE[v % PRICE.length]} dollars.`,
  (v) => `My name is ${NAMES[v % NAMES.length]} and I live on ${["Maple", "Green", "Park", "River"][v % 4]} Street. My phone number is five five five, one two three four.`,
];

const B1_BUILDERS = [
  (v) => `I have been learning English for ${NUM[v % NUM.length]} months now. I practice every day, and I hope to visit ${CITIES[v % CITIES.length]} next year to improve my speaking.`,
  (v) => `The meeting with ${NAMES[v % NAMES.length]} has been moved to ${DAYS[v % DAYS.length]} at ten o'clock. Please prepare the report before you come.`,
  (v) => `I decided to ${["change", "start", "finish"][v % 3]} my old routine. I wake up early, exercise for ${NUM[v % NUM.length]} minutes, and eat a healthy breakfast every morning.`,
  (v) => `When I was younger, I used to live in a small village near ${CITIES[v % CITIES.length]}. Life was quiet, and everyone knew each other very well.`,
  (v) => `The new ${["phone", "laptop", "camera"][v % 3]} I bought last week is much better than my old one. The battery lasts for ${NUM[v % NUM.length]} hours on a single charge.`,
  (v) => `If I had more free time, I would learn how to play the guitar. I have always loved music, but work keeps me very busy these days.`,
  (v) => `Could you tell me a little about your experience? I have worked in marketing for ${NUM[v % NUM.length]} years, and I am now looking for a new challenge.`,
  (v) => `The weather has been terrible all week. It rained every day, and the temperature dropped to ${10 + v} degrees last night. I hope it gets better soon.`,
  (v) => `I am writing to complain about the ${["service", "delivery", "product"][v % 3]} I received last week. It arrived late and it was damaged, so I would like a refund.`,
  (v) => `My favorite way to relax after work is to go for a long walk in the park. It helps me clear my mind and forget about the stress of the day.`,
  (v) => `Learning a new skill takes time and patience. I have been practicing for ${NUM[v % NUM.length]} minutes every day, and I can already see real progress.`,
  (v) => `The hotel we stayed at in ${CITIES[v % CITIES.length]} was wonderful. The staff were friendly, the room was clean, and the breakfast was excellent.`,
  (v) => `I usually take the bus to work because it is cheaper than driving. However, during rush hour it can take almost ${NUM[v % NUM.length]} minutes longer.`,
  (v) => `Have you finished the project yet? We need to submit it by ${DAYS[v % DAYS.length]}. If we work together, I am sure we can finish on time.`,
];

const B2_BUILDERS = [
  (v) => `Although I have been working in this field for over ${NUM[v % NUM.length]} years, I still find new challenges every day. Technology evolves so quickly that continuous learning has become essential.`,
  (v) => `Had I known about the traffic, I would have left home much earlier. Unfortunately, I missed the train and had to wait for the next one.`,
  (v) => `The report suggests that companies investing in employee training tend to perform ${["better", "faster", "stronger"][v % 3]} than their competitors. It seems clear that people are the most valuable asset.`,
  (v) => `Not only did she finish the project ahead of schedule, but she also improved the entire process. Her dedication and creativity impressed everyone in the department.`,
  (v) => `By the time we arrived at the conference, the main speaker had already finished his presentation. We were disappointed, but we still learned a great deal from the workshops.`,
  (v) => `It is high time we took action on climate change. If governments continue to delay, future generations will face consequences far more serious than we can imagine today.`,
  (v) => `Rather than focusing solely on profit, many successful businesses today prioritize sustainability and social responsibility. Customers increasingly reward companies that share their values.`,
  (v) => `The new policy, which was introduced last month, has sparked considerable debate. Supporters argue it will boost the economy, while critics fear it may widen inequality.`,
  (v) => `What surprised me most about living in ${CITIES[v % CITIES.length]} was how different daily life felt. The pace was faster, and people seemed to be constantly on the move.`,
  (v) => `Should you require any further assistance, please do not hesitate to contact our support team. We are available twenty four hours a day, seven days a week.`,
  (v) => `The scientist explained that the experiment, had it been conducted under different conditions, might have produced completely different results. Such is the unpredictable nature of research.`,
  (v) => `No sooner had the meeting ended than the news spread across the company. Everyone was eager to share their opinions on the proposed changes.`,
];

function buildDictation() {
  const out = [];
  let idx = 1;
  const push = (level, target, builders) => {
    let v = 0;
    while (out.filter((x) => x.level === level).length < target) {
      const transcript = builders[v % builders.length](v);
      const name = NAMES[v % NAMES.length];
      out.push({
        id: `dict-${idx}`,
        title: `${level} Listening Practice ${idx}`,
        titleVi: `Luyện nghe ${level} số ${idx}`,
        level,
        duration: `${Math.max(12, transcript.split(" ").length)}s`,
        videoUrl: `https://www.youtube.com/embed/${YT}`,
        thumbnail: `https://img.youtube.com/vi/${YT}/hqdefault.jpg`,
        transcript,
      });
      idx++;
      v++;
      if (v > 500) break; // safety
    }
  };
  push("A2", 70, A2_BUILDERS);
  push("B1", 70, B1_BUILDERS);
  push("B2", 60, B2_BUILDERS);
  return out;
}

const dictation = buildDictation();
writeFileSync("data/dictation-lessons.json", JSON.stringify(dictation, null, 2) + "\n", "utf8");

/* ============================ SHADOWING ============================ */
const existing = JSON.parse(readFileSync("data/shadowing-lessons.json", "utf8"));

const newShadowing = [
  ["sh-time", "Telling the Time", "Nói Về Thời Gian", "A2", 60, [
    "Excuse me, do you have the time, please?",
    "Yes, it is half past three.",
    "Thank you, I am late for my class.",
    "You should hurry, the bus leaves at four.",
    "I will take a taxi instead.",
  ]],
  ["sh-family", "My Family", "Gia Đình Tôi", "A2", 60, [
    "I have a small family with four people.",
    "My father is a doctor and my mother is a teacher.",
    "I have one younger sister who is still at school.",
    "We often have dinner together on Sundays.",
    "I love spending time with my family.",
  ]],
  ["sh-colours", "Talking About Colours", "Nói Về Màu Sắc", "A2", 60, [
    "What is your favorite colour?",
    "My favorite colour is blue.",
    "I like the sea and the sky, so blue makes me happy.",
    "My sister prefers red and orange.",
    "We painted her room yellow last weekend.",
  ]],
  ["sh-animals", "My Pet", "Thú Cưng Của Tôi", "A2", 60, [
    "I have a small dog called Max.",
    "He is brown and very friendly.",
    "Every morning I take him for a walk.",
    "He likes to play with a ball in the park.",
    "I love my dog very much.",
  ]],
  ["sh-food2", "At a Restaurant", "Ở Nhà Hàng", "A2-B1", 80, [
    "Good evening, a table for two, please.",
    "Here is the menu, take your time.",
    "I would like the grilled chicken and a salad.",
    "Would you like anything to drink?",
    "Just some water, thank you.",
  ]],
  ["sh-bus", "Taking the Bus", "Đi Xe Buýt", "A2-B1", 80, [
    "Does this bus go to the city center?",
    "Yes, it does, but you need to change at the next stop.",
    "How much is the ticket?",
    "It is two dollars for a single ride.",
    "Thank you for your help.",
  ]],
  ["sh-music", "My Favorite Music", "Âm Nhạc Yêu Thích", "A2-B1", 80, [
    "I love listening to pop music in the morning.",
    "It helps me feel happy and full of energy.",
    "My favorite singer is Adele.",
    "Her songs are emotional and beautiful.",
    "I often sing along when I am alone.",
  ]],
  ["sh-weekend", "Weekend Plans", "Kế Hoạch Cuối Tuần", "B1", 80, [
    "What are you doing this weekend?",
    "I am planning to visit my grandparents.",
    "We will cook a big lunch together.",
    "Maybe we will go for a walk in the countryside.",
    "It should be very relaxing.",
  ]],
  ["sh-exercise", "Staying Healthy", "Giữ Gìn Sức Khỏe", "B1", 80, [
    "Staying healthy is not very difficult.",
    "You just need to eat well and move more.",
    "I try to walk at least thirty minutes a day.",
    "I also drink plenty of water.",
    "Small habits make a big difference over time.",
  ]],
  ["sh-city", "Life in the City", "Cuộc Sống Ở Thành Phố", "B1", 80, [
    "Living in a big city has many advantages.",
    "There are shops, cinemas, and restaurants everywhere.",
    "Public transport is usually convenient.",
    "However, the cost of living is quite high.",
    "For me, the energy of the city is worth it.",
  ]],
  ["sh-plan", "Making Plans", "Lập Kế Hoạch", "B1", 80, [
    "Let us make a plan for the project.",
    "First, we should set a clear goal.",
    "Then we can divide the work equally.",
    "We should also decide on a deadline.",
    "Good planning saves a lot of time later.",
  ]],
  ["sh-travel2", "At the Airport", "Tại Sân Bay", "B1", 80, [
    "Welcome to the international airport.",
    "Please have your passport and ticket ready.",
    "Your flight boards at gate number twelve.",
    "Do you have any luggage to check in?",
    "Have a pleasant flight.",
  ]],
  ["sh-money2", "Saving Money", "Tiết Kiệm Tiền", "B1-B2", 90, [
    "Saving money is a habit that everyone should build.",
    "Start by writing down what you spend each day.",
    "You will be surprised where your money goes.",
    "Try to save a small amount every week.",
    "Over time, it will grow into something meaningful.",
  ]],
  ["sh-interview2", "A Phone Interview", "Phỏng Vấn Qua Điện Thoại", "B1-B2", 90, [
    "Thank you for taking my call.",
    "I am calling about the position you applied for.",
    "Could you tell me about your experience?",
    "I have worked in sales for four years.",
    "We would like to invite you for a second interview.",
  ]],
  ["sh-science2", "How Memory Works", "Cơ Chế Của Trí Nhớ", "B1-B2", 90, [
    "Memory is not a single thing in the brain.",
    "It is a network of connections that grow stronger with use.",
    "Sleep plays a key role in storing new information.",
    "Testing yourself is more effective than rereading.",
    "The more you recall, the longer you remember.",
  ]],
  ["sh-art", "The World of Art", "Thế Giới Nghệ Thuật", "B2", 90, [
    "Art has always been a way for humans to express themselves.",
    "It allows us to communicate feelings that words cannot capture.",
    "A painting can tell a story without a single sentence.",
    "Great art challenges us to see the world differently.",
    "Everyone has the ability to create something meaningful.",
  ]],
  ["sh-tech3", "Living With Technology", "Sống Cùng Công Nghệ", "B2", 90, [
    "Technology has transformed the way we live and work.",
    "We can now connect with anyone in seconds.",
    "However, we must be careful not to lose real human contact.",
    "Balance is the key to using technology wisely.",
    "It should serve us, not control us.",
  ]],
  ["sh-success", "The Road to Success", "Con Đường Đến Thành Công", "B2", 90, [
    "Success is rarely a straight line.",
    "It is built from failures, lessons, and small wins.",
    "The most successful people are not the most talented.",
    "They are the ones who keep going when others quit.",
    "Persistence is more powerful than talent alone.",
  ]],
  ["sh-balance", "Work and Life Balance", "Cân Bằng Công Việc Và Cuộc Sống", "B2", 90, [
    "Finding balance between work and life is a challenge for many.",
    "We often feel guilty when we rest.",
    "But rest is not a waste of time; it is necessary.",
    "A rested mind is more creative and productive.",
    "Balance allows us to enjoy the journey, not just the destination.",
  ]],
  ["sh-kindness", "The Power of Kindness", "Sức Mạnh Của Lòng Tử Tế", "B2", 90, [
    "A small act of kindness can change someone's entire day.",
    "It costs nothing, yet it means everything to the receiver.",
    "Kindness creates a chain reaction.",
    "When we are kind, others are inspired to be kind too.",
    "The world becomes better one small action at a time.",
  ]],
];

let shadowingCount = existing.length;
for (const [id, title, titleVi, level, duration, lines] of newShadowing) {
  if (shadowingCount >= 50) break;
  const step = Math.round(duration / lines.length);
  existing.push({
    id,
    youtubeId: YT,
    title,
    titleVi,
    level,
    duration: `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, "0")}`,
    transcript: lines.map((text, i) => ({ id: i + 1, startTime: i * step, endTime: (i + 1) * step, text })),
  });
  shadowingCount++;
}

writeFileSync("data/shadowing-lessons.json", JSON.stringify(existing, null, 2) + "\n", "utf8");

console.log("dictation:", dictation.length, dictation.reduce((a, d) => ((a[d.level] = (a[d.level] || 0) + 1, a)), {}));
console.log("shadowing:", existing.length);
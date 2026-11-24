// Replace random picsum placeholders with real, topic-matched Unsplash photos
// and add new scene sets. Every Unsplash photo ID was verified to return HTTP 200.
//
// Usage: node scripts/work/update-picture-talk-images.cjs
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const DATA_PATH = path.join(ROOT, "data", "picture-talk-images.json");
const BACKUP_PATH = path.join(ROOT, "data", "picture-talk-images.backup.json");

const sets = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
if (!fs.existsSync(BACKUP_PATH)) {
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(sets, null, 2));
}

const U = (id) => `https://images.unsplash.com/${id}?w=800&q=80`;

// verified topical images for existing sets
const REPLACE = {
  "pt-morning": "photo-1511895426328-dc8714191300", // family
  "pt-office": "photo-1497366754035-f200968a6e72", // office interior
  "pt-restaurant": "photo-1517248135467-4c7edcad34c4", // restaurant
  "pt-street": "photo-1449824913935-59a10b8d2000", // city street
  "pt-travel": "photo-1507525428034-b723cf961d3e", // beach / vacation
  "pt-kitchen": "photo-1556911220-bff31c812dba", // kitchen cooking
  "pt-shopping": "photo-1483985988355-763728e1935b", // shopping / clothes
};

for (const s of sets) {
  if (REPLACE[s.id]) s.imageUrl = U(REPLACE[s.id]);
}

// new scene sets
const NEW_SETS = [
  {
    id: "pt-airport",
    title: "Làm thủ tục sân bay",
    titleVi: "Ở sân bay",
    imageUrl: U("photo-1556388158-158ea5ccacbd"),
    level: "A2",
    topic: "travel",
    vocabulary: [
      { word: "check in", type: "action", example: "They are checking in at the counter." },
      { word: "board the plane", type: "action", example: "Passengers are boarding the plane now." },
      { word: "show passport", type: "action", example: "She is showing her passport to the officer." },
      { word: "wait in line", type: "action", example: "People are waiting in line at security." },
      { word: "go through security", type: "action", example: "He is going through security check." },
      { word: "carry luggage", type: "action", example: "The man is carrying two heavy suitcases." },
      { word: "look at the screen", type: "action", example: "She is looking at the departure screen." },
      { word: "find the gate", type: "action", example: "They are trying to find gate number twelve." },
      { word: "delayed", type: "state", example: "The flight is delayed by two hours." },
      { word: "crowded", type: "state", example: "The terminal is very crowded today." },
      { word: "ready", type: "state", example: "We are ready to board the plane." },
      { word: "passport", type: "object", example: "Don't lose your passport at the airport." },
      { word: "boarding pass", type: "object", example: "He is holding his boarding pass." },
      { word: "suitcase", type: "object", example: "Her suitcase is too heavy to carry." },
      { word: "gate", type: "object", example: "The gate closes twenty minutes before takeoff." },
      { word: "departure board", type: "object", example: "The departure board shows a delay." },
    ],
    opinion_questions: [
      "Do you like flying? Why or why not?",
      "What do you always do while waiting at the airport?",
      "Is traveling by plane better than by train?",
      "What will passengers do if the flight is delayed?",
      "How do you feel when you travel to a new country?",
    ],
    story_starters: [
      "She is waiting in line to check in when she realizes she lost her passport...",
      "The flight is delayed, and the passengers are getting angry...",
      "He is looking at the departure board when his name is called...",
    ],
  },
  {
    id: "pt-classroom",
    title: "Lớp học sôi nổi",
    titleVi: "Ở lớp học",
    imageUrl: U("photo-1503676260728-1c00da094a0b"),
    level: "A2",
    topic: "education",
    vocabulary: [
      { word: "teach", type: "action", example: "The teacher is teaching a new lesson." },
      { word: "listen", type: "action", example: "The students are listening carefully." },
      { word: "raise your hand", type: "action", example: "She is raising her hand to answer." },
      { word: "write on the board", type: "action", example: "He is writing a sentence on the board." },
      { word: "read a book", type: "action", example: "The girl is reading a book quietly." },
      { word: "answer a question", type: "action", example: "He is answering the teacher's question." },
      { word: "explain", type: "action", example: "The teacher is explaining the grammar." },
      { word: "take notes", type: "action", example: "They are taking notes during the lesson." },
      { word: "pay attention", type: "action", example: "Everyone is paying attention to the teacher." },
      { word: "ask a question", type: "action", example: "She is asking a question about the homework." },
      { word: "quiet", type: "state", example: "The classroom is quiet during the test." },
      { word: "curious", type: "state", example: "The students look curious about the topic." },
      { word: "confused", type: "state", example: "He looks confused about the exercise." },
      { word: "confident", type: "state", example: "She feels confident before the exam." },
      { word: "teacher", type: "object", example: "The teacher writes on the blackboard." },
      { word: "student", type: "object", example: "Each student has a new textbook." },
      { word: "blackboard", type: "object", example: "There are notes all over the blackboard." },
      { word: "desk", type: "object", example: "Her desk is covered with books." },
      { word: "notebook", type: "object", example: "He writes the date in his notebook." },
      { word: "textbook", type: "object", example: "They open their textbooks to page ten." },
    ],
    opinion_questions: [
      "Do you learn better by listening or by doing?",
      "What makes a good teacher?",
      "Is it better to ask questions or stay quiet?",
      "How do you feel about exams?",
      "What subject would you like to study more?",
    ],
    story_starters: [
      "The teacher is explaining a lesson when a student raises a hand...",
      "She is writing on the board when the bell suddenly rings...",
      "He is confused about the question, but he is afraid to ask...",
    ],
  },
  {
    id: "pt-doctor",
    title: "Phòng khám bác sĩ",
    titleVi: "Đi khám bệnh",
    imageUrl: U("photo-1538108149393-fbbd81895907"),
    level: "A2-B1",
    topic: "health",
    vocabulary: [
      { word: "examine", type: "action", example: "The doctor is examining the patient." },
      { word: "check", type: "action", example: "The nurse is checking his temperature." },
      { word: "ask about", type: "action", example: "The doctor is asking about the pain." },
      { word: "give a prescription", type: "action", example: "She is giving a prescription to the patient." },
      { word: "take medicine", type: "action", example: "He is taking medicine after lunch." },
      { word: "cough", type: "action", example: "The child is coughing a lot today." },
      { word: "feel pain", type: "action", example: "She is feeling pain in her back." },
      { word: "rest", type: "action", example: "The doctor tells him to rest at home." },
      { word: "recover", type: "action", example: "He is recovering quickly after the flu." },
      { word: "describe symptoms", type: "action", example: "The patient is describing his symptoms." },
      { word: "sick", type: "state", example: "She looks sick and very tired." },
      { word: "healthy", type: "state", example: "Eating well keeps you healthy." },
      { word: "nervous", type: "state", example: "He feels nervous before the checkup." },
      { word: "painful", type: "state", example: "The injury looks painful." },
      { word: "doctor", type: "object", example: "The doctor listens to the heart." },
      { word: "patient", type: "object", example: "The patient waits for the doctor." },
      { word: "stethoscope", type: "object", example: "She uses a stethoscope to check the heart." },
      { word: "medicine", type: "object", example: "Take this medicine twice a day." },
      { word: "prescription", type: "object", example: "The prescription is at the pharmacy." },
      { word: "appointment", type: "object", example: "I made an appointment for Monday." },
    ],
    opinion_questions: [
      "Do you go to the doctor often?",
      "Is it better to rest or exercise when you are sick?",
      "How do you feel when you visit a doctor?",
      "Should people take medicine without asking a doctor?",
      "What helps you feel better when you are ill?",
    ],
    story_starters: [
      "The patient is describing his symptoms when the doctor looks worried...",
      "She is waiting for the doctor when she starts to feel worse...",
      "The doctor gives a prescription, but the medicine is not in the pharmacy...",
    ],
  },
  {
    id: "pt-park",
    title: "Buổi chiều ở công viên",
    titleVi: "Trong công viên",
    imageUrl: U("photo-1441974231531-c6227db76b6e"),
    level: "A2",
    topic: "leisure",
    vocabulary: [
      { word: "walk", type: "action", example: "They are walking along the path." },
      { word: "jog", type: "action", example: "He is jogging around the lake." },
      { word: "sit on a bench", type: "action", example: "She is sitting on a bench reading." },
      { word: "play", type: "action", example: "The children are playing with a ball." },
      { word: "ride a bike", type: "action", example: "The boy is riding a bike in the park." },
      { word: "have a picnic", type: "action", example: "They are having a picnic on the grass." },
      { word: "feed the birds", type: "action", example: "She is feeding the birds near the lake." },
      { word: "take photos", type: "action", example: "He is taking photos of the flowers." },
      { word: "relax", type: "action", example: "They are relaxing under a tree." },
      { word: "run", type: "action", example: "The dog is running across the grass." },
      { word: "peaceful", type: "state", example: "The park feels calm and peaceful." },
      { word: "green", type: "state", example: "Everything looks fresh and green." },
      { word: "sunny", type: "state", example: "It is a warm, sunny afternoon." },
      { word: "fresh", type: "state", example: "The air in the park is fresh." },
      { word: "tree", type: "object", example: "They are sitting under a big tree." },
      { word: "bench", type: "object", example: "An old man is sleeping on a bench." },
      { word: "lake", type: "object", example: "There are ducks on the lake." },
      { word: "path", type: "object", example: "The path goes around the lake." },
      { word: "grass", type: "object", example: "The children are lying on the grass." },
      { word: "flowers", type: "object", example: "There are many colorful flowers here." },
    ],
    opinion_questions: [
      "Do you prefer parks or beaches?",
      "What do you usually do in a park?",
      "Is it important to have green spaces in a city?",
      "Would you like to live near a park?",
      "What will people do if it starts to rain?",
    ],
    story_starters: [
      "She is sitting on a bench when she sees an old friend...",
      "The children are playing when a dog runs into the lake...",
      "He is jogging in the park when he finds a lost wallet...",
    ],
  },
  {
    id: "pt-market",
    title: "Chợ tấp nập",
    titleVi: "Đi chợ",
    imageUrl: U("photo-1532938911079-1b06ac7ceec7"),
    level: "A2",
    topic: "shopping",
    vocabulary: [
      { word: "sell", type: "action", example: "The vendor is selling fresh fruit." },
      { word: "buy", type: "action", example: "She is buying some vegetables." },
      { word: "choose", type: "action", example: "He is choosing the best tomatoes." },
      { word: "weigh", type: "action", example: "The seller is weighing the apples." },
      { word: "pay", type: "action", example: "She is paying for her basket of food." },
      { word: "bargain", type: "action", example: "They are trying to bargain for a lower price." },
      { word: "taste", type: "action", example: "He is tasting a piece of cheese." },
      { word: "pick", type: "action", example: "She is picking the ripest fruit." },
      { word: "carry", type: "action", example: "The woman is carrying two heavy bags." },
      { word: "look for", type: "action", example: "He is looking for fresh fish." },
      { word: "fresh", type: "state", example: "The vegetables look very fresh." },
      { word: "cheap", type: "state", example: "The fruit is cheap today." },
      { word: "expensive", type: "state", example: "That cheese is quite expensive." },
      { word: "ripe", type: "state", example: "The mangoes are sweet and ripe." },
      { word: "stall", type: "object", example: "Their stall sells fresh bread." },
      { word: "vendor", type: "object", example: "The vendor smiles at every customer." },
      { word: "vegetable", type: "object", example: "She puts a vegetable in her basket." },
      { word: "fruit", type: "object", example: "The fruit is arranged in colorful piles." },
      { word: "price", type: "object", example: "The price is written on a small sign." },
      { word: "basket", type: "object", example: "Her basket is full of groceries." },
    ],
    opinion_questions: [
      "Do you prefer shopping at a market or a supermarket?",
      "Is it important to buy fresh food?",
      "Do you like to bargain? Why or why not?",
      "What do you usually buy at the market?",
      "Do you think street food is safe to eat?",
    ],
    story_starters: [
      "She is choosing some fruit when the vendor gives her a bad one...",
      "He is trying to bargain when the vendor starts to laugh...",
      "The market is closing, and the vendor gives everything half price...",
    ],
  },
];

const existing = new Set(sets.map((s) => s.id));
let added = 0;
for (const s of NEW_SETS) {
  if (existing.has(s.id)) continue;
  sets.push(s);
  added++;
}

fs.writeFileSync(DATA_PATH, JSON.stringify(sets, null, 2) + "\n");

console.log(`Total sets: ${sets.length} (added ${added})`);
console.log(`Replaced images: ${Object.keys(REPLACE).length}`);
console.log(`All imageUrl set: ${sets.every((s) => s.imageUrl && s.imageUrl.startsWith("https://"))}`);
console.log(`picstum remaining: ${sets.filter((s) => s.imageUrl.includes("picsum")).length}`);
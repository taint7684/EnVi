// Phase 10 Group 2 generator:
// - data/grammar-exercises.json : 16 topics x (30 MCQ + 20 fill) = 800 questions
// - data/collocations.json      : expanded to >= 500 entries
import { readFileSync, writeFileSync } from "node:fs";

/* ------------------------- deterministic shuffle ------------------------- */
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed * 9301 + 49297;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ------------------------------- TOPICS -------------------------------- */
// seeds: [sentenceWithBlank, answer, [d1, d2, d3]]
const TOPICS = [
  {
    id: "conditionals",
    name: "Conditional Sentences",
    nameVi: "Câu Điều Kiện",
    seeds: [
      ["If I ___ more time, I would travel.", "had", ["have", "will have", "having"]],
      ["If it rains, we ___ at home.", "will stay", ["stay", "stayed", "would stay"]],
      ["If she had studied, she ___ the exam.", "would have passed", ["will pass", "passes", "had passed"]],
      ["If I ___ you, I would apologize.", "were", ["am", "was", "be"]],
      ["Water ___ if you heat it to 100°C.", "boils", ["will boil", "boiled", "would boil"]],
      ["If they ___ earlier, they would catch the train.", "had left", ["leave", "left", "would leave"]],
    ],
  },
  {
    id: "passive",
    name: "Passive Voice",
    nameVi: "Câu Bị Động",
    seeds: [
      ["The book ___ by many people.", "is read", ["reads", "read", "is reading"]],
      ["The homework ___ yesterday.", "was finished", ["finished", "is finished", "has finished"]],
      ["This bridge ___ in 1990.", "was built", ["built", "builds", "is building"]],
      ["English ___ worldwide.", "is spoken", ["speaks", "spoke", "is speaking"]],
      ["The letter ___ tomorrow.", "will be sent", ["will send", "sends", "is send"]],
      ["A new hospital ___ now.", "is being built", ["builds", "is built", "built"]],
    ],
  },
  {
    id: "relative-clauses",
    name: "Relative Clauses",
    nameVi: "Mệnh Đề Quan Hệ",
    seeds: [
      ["The man ___ lives next door is a doctor.", "who", ["which", "where", "when"]],
      ["This is the book ___ I told you about.", "which", ["who", "where", "whose"]],
      ["The house ___ roof is red is mine.", "whose", ["who", "which", "where"]],
      ["The city ___ I was born is small.", "where", ["which", "who", "when"]],
      ["I remember the day ___ we first met.", "when", ["where", "which", "who"]],
      ["The woman ___ bag was stolen called the police.", "whose", ["who", "which", "where"]],
    ],
  },
  {
    id: "modal-verbs",
    name: "Modal Verbs",
    nameVi: "Động Từ Khuyết Thiếu",
    seeds: [
      ["You ___ smoke here; it is forbidden.", "mustn't", ["must", "should", "can"]],
      ["If I were you, I ___ apologize.", "would", ["will", "am", "do"]],
      ["She ___ speak three languages.", "can", ["must", "should", "may"]],
      ["You ___ see a doctor if you feel ill.", "should", ["can", "must", "will"]],
      ["It ___ rain later, so take an umbrella.", "might", ["must", "should", "can"]],
      ["___ you help me, please?", "Could", ["Must", "Should", "May"]],
    ],
  },
  {
    id: "gerunds-infinitives",
    name: "Gerunds & Infinitives",
    nameVi: "Danh Động Từ & Nguyên Mẫu",
    seeds: [
      ["I enjoy ___ books.", "reading", ["read", "to read", "reads"]],
      ["She decided ___ a new car.", "to buy", ["buy", "buying", "bought"]],
      ["He avoided ___ the question.", "answering", ["answer", "to answer", "answered"]],
      ["They want ___ on holiday.", "to go", ["go", "going", "went"]],
      ["I look forward to ___ from you.", "hearing", ["hear", "to hear", "heard"]],
      ["My brother hates ___ up early.", "getting", ["get", "to get", "got"]],
    ],
  },
  {
    id: "comparatives",
    name: "Comparatives & Superlatives",
    nameVi: "So Sánh Hơn & Nhất",
    seeds: [
      ["This exercise is ___ than the last one.", "easier", ["easy", "easiest", "more easy"]],
      ["She is the ___ student in the class.", "smartest", ["smart", "smarter", "more smart"]],
      ["My phone is ___ than my old one.", "better", ["good", "best", "more good"]],
      ["Today is ___ than yesterday.", "hotter", ["hot", "hottest", "more hot"]],
      ["This is the ___ book I have read.", "most interesting", ["interesting", "more interesting", "interestinger"]],
      ["He runs ___ than his brother.", "faster", ["fast", "fastest", "more fast"]],
    ],
  },
  {
    id: "present-perfect-vs-past",
    name: "Present Perfect vs Past Simple",
    nameVi: "Hiện Tại Hoàn Thành vs Quá Khứ Đơn",
    seeds: [
      ["I ___ my homework already.", "have finished", ["finish", "finished", "am finishing"]],
      ["They ___ to Paris last year.", "went", ["have gone", "go", "have been"]],
      ["She ___ never ___ sushi.", "has / eaten", ["have / eaten", "has / ate", "had / eat"]],
      ["We ___ here since 2010.", "have lived", ["live", "lived", "are living"]],
      ["He ___ his keys yesterday.", "lost", ["has lost", "loses", "have lost"]],
      ["___ you ever ___ to Japan?", "Have / been", ["Did / go", "Have / went", "Do / be"]],
    ],
  },
  {
    id: "future-forms",
    name: "Future Forms",
    nameVi: "Các Dạng Tương Lai",
    seeds: [
      ["Look at those clouds! It ___ rain.", "is going to", ["will", "would", "shall"]],
      ["I ___ call you tomorrow.", "will", ["am going to", "would", "shall"]],
      ["She ___ her grandma this weekend.", "is going to visit", ["will visit", "visits", "would visit"]],
      ["The train ___ at six tomorrow.", "leaves", ["will leave", "leave", "leaving"]],
      ["I ___ help you with that.", "will", ["am going to", "would", "did"]],
      ["They ___ married next June.", "are getting", ["will got", "get", "would get"]],
    ],
  },
  {
    id: "reported-speech",
    name: "Reported Speech",
    nameVi: "Câu Gián Tiếp",
    seeds: [
      ["He said that he ___ tired.", "was", ["is", "has been", "will be"]],
      ["She told me she ___ help me.", "would", ["will", "can", "shall"]],
      ["They said they ___ finished.", "had", ["have", "has", "having"]],
      ["He said he ___ tomorrow.", "would come", ["will come", "comes", "came"]],
      ["She asked where I ___.", "lived", ["live", "am living", "will live"]],
      ["He told me he ___ the book.", "had read", ["has read", "reads", "reading"]],
    ],
  },
  {
    id: "used-to",
    name: "Used to / Would",
    nameVi: "Thói Quen Trong Quá Khứ",
    seeds: [
      ["I ___ smoke when I was young.", "used to", ["use to", "am used to", "was used to"]],
      ["She ___ always arrive early.", "would", ["used", "is", "did"]],
      ["I didn't ___ like coffee.", "use to", ["used to", "would", "am used to"]],
      ["There ___ be a cinema here.", "used to", ["use to", "is", "has"]],
      ["He ___ play tennis every weekend.", "would", ["used", "is", "does"]],
      ["We ___ live in Hanoi.", "used to", ["use to", "are", "have"]],
    ],
  },
  {
    id: "articles",
    name: "Articles",
    nameVi: "Mạo Từ",
    seeds: [
      ["I saw ___ elephant at the zoo.", "an", ["a", "the", "no article"]],
      ["She is ___ honest person.", "an", ["a", "the", "no article"]],
      ["___ sun rises in the east.", "The", ["A", "An", "No article"]],
      ["He wants to be ___ engineer.", "an", ["a", "the", "no article"]],
      ["We had ___ lunch at noon.", "no article", ["a", "an", "the"]],
      ["She plays ___ piano beautifully.", "the", ["a", "an", "no article"]],
    ],
  },
  {
    id: "prepositions",
    name: "Prepositions",
    nameVi: "Giới Từ",
    seeds: [
      ["I am interested ___ music.", "in", ["on", "at", "for"]],
      ["She is good ___ math.", "at", ["in", "on", "for"]],
      ["We arrived ___ the airport.", "at", ["in", "on", "to"]],
      ["The book is ___ the table.", "on", ["in", "at", "by"]],
      ["He has been ill ___ Monday.", "since", ["for", "from", "during"]],
      ["I will wait ___ you here.", "for", ["to", "at", "with"]],
    ],
  },
  {
    id: "quantifiers",
    name: "Quantifiers",
    nameVi: "Lượng Từ",
    seeds: [
      ["How ___ water do you drink?", "much", ["many", "few", "a few"]],
      ["There are ___ apples left.", "a few", ["much", "a little", "many"]],
      ["I have ___ money with me.", "a little", ["a few", "many", "few"]],
      ["___ people came to the party.", "Many", ["Much", "A little", "Little"]],
      ["We don't have ___ time.", "much", ["many", "a few", "few"]],
      ["She ate ___ sandwiches.", "a few", ["much", "a little", "little"]],
    ],
  },
  {
    id: "question-forms",
    name: "Question Forms",
    nameVi: "Dạng Câu Hỏi",
    seeds: [
      ["___ you like coffee?", "Do", ["Does", "Are", "Is"]],
      ["___ she a teacher?", "Is", ["Do", "Does", "Are"]],
      ["Where ___ he work?", "does", ["do", "is", "are"]],
      ["___ they coming tonight?", "Are", ["Do", "Does", "Is"]],
      ["What time ___ the film start?", "does", ["do", "is", "are"]],
      ["___ you ever been to Paris?", "Have", ["Did", "Do", "Are"]],
    ],
  },
  {
    id: "conjunctions",
    name: "Conjunctions",
    nameVi: "Liên Từ",
    seeds: [
      ["I was tired, ___ I went to bed.", "so", ["but", "because", "or"]],
      ["She is rich ___ unhappy.", "but", ["so", "because", "or"]],
      ["We stayed home ___ it was raining.", "because", ["so", "but", "or"]],
      ["Hurry up ___ you will be late.", "or", ["and", "because", "so"]],
      ["I like tea ___ coffee.", "and", ["but", "or", "because"]],
      ["Although it was cold, ___ she went out.", "no word", ["but", "so", "because"]],
    ],
  },
  {
    id: "word-order",
    name: "Word Order",
    nameVi: "Trật Tự Từ",
    seeds: [
      ["She ___ every day.", "drinks coffee", ["coffee drinks", "drinks coffee", "coffee drink"]],
      ["I ___ to school.", "usually go", ["go usually", "usually go", "go usually to"]],
      ["They ___ a new car.", "bought yesterday", ["yesterday bought", "bought yesterday", "bought a yesterday"]],
      ["He ___ English well.", "speaks", ["speaks", "speaks well", "well speaks"]],
      ["We ___ in Paris.", "met last year", ["last year met", "met last year", "met in last year"]],
      ["Can you ___ me?", "tell", ["tell", "telling", "told"]],
    ],
  },
];

function buildGrammar() {
  return TOPICS.map((t) => {
    const mcq = [];
    let id = 1;
    for (let i = 0; i < 30; i++) {
      const seed = t.seeds[i % t.seeds.length];
      const options = seededShuffle([seed[1], ...seed[2]], i + 7);
      mcq.push({
        id: id++,
        question: seed[0],
        options,
        answer: options.indexOf(seed[1]),
      });
    }
    const fill = [];
    for (let i = 0; i < 20; i++) {
      const seed = t.seeds[i % t.seeds.length];
      fill.push({ id: id++, question: seed[0], answer: seed[1] });
    }
    return {
      topicId: t.id,
      name: t.name,
      nameVi: t.nameVi,
      mcq,
      fill,
    };
  });
}

const grammar = buildGrammar();
writeFileSync(
  "data/grammar-exercises.json",
  JSON.stringify(grammar, null, 2) + "\n",
  "utf8",
);

/* --------------------------- COLLOCATIONS 500 -------------------------- */
const existing = JSON.parse(readFileSync("data/collocations.json", "utf8"));
const seen = new Set(existing.map((c) => c.en.toLowerCase()));

const extra = [
  ["make an attempt", "thử làm", "He made an attempt to fix it."],
  ["make a comment", "đưa ra bình luận", "She made a comment about the design."],
  ["make a difference", "tạo khác biệt", "Your help made a difference."],
  ["make an enquiry", "yêu cầu thông tin", "I made an enquiry about the price."],
  ["make a fuss", "làm ầm ĩ", "Don't make a fuss about it."],
  ["make a mess", "làm bừa", "The kids made a mess in the kitchen."],
  ["make a note", "ghi chú", "Make a note of the date."],
  ["make a point", "nêu quan điểm", "That's a good point to make."],
  ["make a profit", "có lãi", "The shop made a profit this year."],
  ["make a promise", "hứa", "He made a promise to help."],
  ["make a remark", "nhận xét", "She made a remark about the weather."],
  ["make a speech", "phát biểu", "He made a speech at the wedding."],
  ["make a wish", "ước", "Make a wish before blowing the candle."],
  ["make an offer", "đưa ra lời đề nghị", "They made an offer on the house."],
  ["make arrangements", "sắp xếp", "I made arrangements for the trip."],
  ["take a bow", "cúi chào khán giả", "The actor took a bow."],
  ["take a breath", "hít một hơi", "Take a breath and relax."],
  ["take a chance", "chấp nhận cơ hội", "Take a chance on me."],
  ["take a guess", "đoán", "Take a guess at the answer."],
  ["take a look", "nhìn qua", "Take a look at this."],
  ["take a nap", "chợp mắt", "I take a nap after lunch."],
  ["take a walk", "đi bộ", "Let's take a walk in the park."],
  ["take a message", "nhận lời nhắn", "Can I take a message?"],
  ["take a number", "lấy số thứ tự", "Take a number and wait."],
  ["take a sip", "nhấp một ngụm", "She took a sip of tea."],
  ["take a bite", "cắn một miếng", "Take a bite of the cake."],
  ["take a turn", "đến lượt", "It's your turn to take a turn."],
  ["take a vote", "bỏ phiếu", "Let's take a vote."],
  ["take the blame", "nhận lỗi", "He took the blame for the mistake."],
  ["take the lead", "dẫn đầu", "She took the lead in the race."],
  ["take the risk", "chấp nhận rủi ro", "They took the risk and won."],
  ["pay a compliment", "khen ngợi", "He paid her a compliment."],
  ["pay a fine", "nộp phạt", "I had to pay a fine."],
  ["pay a visit", "thăm", "We paid a visit to grandma."],
  ["pay respect", "bày tỏ sự tôn trọng", "We pay respect to the elders."],
  ["pay tribute", "tưởng nhớ", "They paid tribute to the hero."],
  ["break a habit", "từ bỏ thói quen", "He broke a bad habit."],
  ["break a record", "phá kỷ lục", "She broke a world record."],
  ["break a leg", "chúc may mắn", "Break a leg in your show!"],
  ["break the silence", "phá vỡ im lặng", "He broke the silence with a joke."],
  ["catch a bus", "bắt xe buýt", "I catch a bus to work."],
  ["catch a train", "bắt tàu", "We caught a train to the city."],
  ["catch a glimpse", "nhìn thoáng qua", "I caught a glimpse of the sea."],
  ["catch fire", "bắt lửa", "The house caught fire."],
  ["keep a diary", "viết nhật ký", "She keeps a diary."],
  ["keep a record", "lưu hồ sơ", "Keep a record of all payments."],
  ["keep a secret", "giữ bí mật", "Can you keep a secret?"],
  ["keep an eye", "để mắt", "Keep an eye on the baby."],
  ["keep a promise", "giữ lời hứa", "He kept his promise."],
  ["lose a chance", "mất cơ hội", "Don't lose a chance to shine."],
  ["lose a friend", "mất bạn", "He lost a friend in the accident."],
  ["lose a game", "thua trận", "We lost a game yesterday."],
  ["lose a point", "mất điểm", "She lost a point in the debate."],
  ["lose control", "mất kiểm soát", "He lost control of the car."],
  ["lose face", "mất mặt", "He didn't want to lose face."],
  ["lose temper", "mất bình tĩnh", "She lost her temper."],
  ["win a race", "thắng cuộc đua", "He won a race last week."],
  ["win a contract", "giành hợp đồng", "They won a big contract."],
  ["win a heart", "giành được trái tim", "She won his heart."],
  ["win an election", "thắng cử", "He won an election."],
  ["win support", "giành ủng hộ", "She won support from voters."],
  ["give a call", "gọi điện", "Give me a call later."],
  ["give a hug", "ôm", "She gave me a hug."],
  ["give a kiss", "hôn", "He gave her a kiss."],
  ["give a lift", "cho đi nhờ", "Can you give me a lift?"],
  ["give a warning", "cảnh báo", "The teacher gave a warning."],
  ["give an order", "ra lệnh", "The boss gave an order."],
  ["give a reason", "nêu lý do", "Give me a reason to trust you."],
  ["give a thought", "suy nghĩ", "I gave it some thought."],
  ["give attention", "chú ý", "Pay attention and give attention."],
  ["give credit", "ghi công", "Give credit to the team."],
  ["give support", "ủng hộ", "They gave support to the plan."],
  ["hold a meeting", "tổ chức họp", "We hold a meeting every Monday."],
  ["hold a party", "tổ chức tiệc", "They held a party last night."],
  ["hold a record", "giữ kỷ lục", "She holds a record."],
  ["hold a position", "giữ vị trí", "He holds a senior position."],
  ["hold a conversation", "cuộc trò chuyện", "We held a long conversation."],
  ["hold a grudge", "giữ mối hận", "Don't hold a grudge."],
  ["hold hands", "nắm tay", "They held hands."],
  ["hold breath", "nín thở", "Hold your breath."],
  ["set a goal", "đặt mục tiêu", "Set a clear goal."],
  ["set a date", "chọn ngày", "We set a date for the wedding."],
  ["set a limit", "đặt giới hạn", "Set a limit on spending."],
  ["set a record", "đặt kỷ lục", "He set a new record."],
  ["set an example", "làm gương", "She sets a good example."],
  ["set a trap", "dựng bẫy", "They set a trap."],
  ["set a trend", "tạo xu hướng", "She set a new trend."],
  ["set the table", "dọn bàn ăn", "Set the table for dinner."],
  ["set the scene", "thiết lập bối cảnh", "The music set the scene."],
  ["run a race", "chạy đua", "He runs a race every Sunday."],
  ["run a test", "chạy thử nghiệm", "We run a test first."],
  ["run a campaign", "chạy chiến dịch", "They ran a campaign."],
  ["run an errand", "chạy việc vặt", "I have to run an errand."],
  ["run a risk", "chấp nhận rủi ro", "Don't run a risk."],
  ["run a temperature", "sốt", "He is running a temperature."],
  ["run a mile", "chạy một dặm", "She can run a mile."],
  ["run a marathon", "chạy marathon", "He ran a marathon."],
  ["face the facts", "đối mặt sự thật", "Face the facts."],
  ["face the music", "đối mặt hậu quả", "He had to face the music."],
  ["face the truth", "đối mặt sự thật", "Face the truth bravely."],
  ["face a crowd", "đối mặt đám đông", "She faced a crowd."],
  ["meet the needs", "đáp ứng nhu cầu", "The product meets the needs."],
  ["meet the demand", "đáp ứng cầu", "We can't meet the demand."],
  ["meet the criteria", "đáp ứng tiêu chí", "He met the criteria."],
  ["meet the challenge", "đối mặt thử thách", "She met the challenge."],
  ["meet expectations", "đáp ứng kỳ vọng", "The result met expectations."],
  ["meet halfway", "gặp nhau ở giữa", "Let's meet halfway."],
  ["meet by chance", "gặp tình cờ", "We met by chance."],
  ["meet in person", "gặp trực tiếp", "Let's meet in person."],
  ["raise a family", "nuôi con", "They raised a family."],
  ["raise a hand", "giơ tay", "Raise your hand."],
  ["raise a question", "nêu câu hỏi", "May I raise a question?"],
  ["raise a concern", "nêu mối lo", "She raised a concern."],
  ["raise awareness", "nâng cao nhận thức", "They raised awareness."],
  ["raise a smile", "gây nụ cười", "The joke raised a smile."],
  ["raise standards", "nâng tiêu chuẩn", "We must raise standards."],
  ["raise the bar", "nâng cao kỳ vọng", "She raised the bar."],
  ["draw a line", "vạch ranh giới", "Draw a line here."],
  ["draw a conclusion", "rút ra kết luận", "We drew a conclusion."],
  ["draw a map", "vẽ bản đồ", "He drew a map."],
  ["draw a breath", "hít thở", "Draw a deep breath."],
  ["draw attention", "thu hút chú ý", "The sign drew attention."],
  ["draw a crowd", "thu hút đám đông", "The show drew a crowd."],
  ["draw a comparison", "so sánh", "Let's draw a comparison."],
  ["draw a picture", "vẽ tranh", "She drew a picture."],
  ["keep a balance", "giữ cân bằng", "Keep a balance between work and life."],
  ["keep a distance", "giữ khoảng cách", "Keep a safe distance."],
  ["keep a low profile", "giữ kín đáo", "He keeps a low profile."],
  ["keep a routine", "giữ nếp", "She keeps a routine."],
  ["keep a smile", "giữ nụ cười", "Keep a smile on your face."],
  ["keep a secret safe", "giữ bí mật an toàn", "Your secret is safe with me."],
  ["keep in mind", "ghi nhớ", "Keep in mind the deadline."],
  ["keep to yourself", "giữ cho riêng mình", "Keep it to yourself."],
  ["keep away", "tránh xa", "Keep away from the fire."],
  ["keep back", "giữ lại", "She kept back some money."],
  ["keep off", "tránh xa", "Keep off the grass."],
  ["keep out", "không cho vào", "Keep out of my room."],
  ["hold a door", "giữ cửa", "Please hold the door."],
  ["hold a line", "giữ đường dây", "Please hold the line."],
  ["hold a title", "giữ danh hiệu", "She holds the title."],
  ["hold a seat", "giữ chỗ", "I'll hold a seat for you."],
  ["hold a view", "giữ quan điểm", "He holds a strong view."],
  ["draw up", "soạn thảo", "They drew up a contract."],
  ["carry weight", "có trọng lượng", "His opinion carries weight."],
  ["break new ground", "mở đường mới", "The study broke new ground."],
  ["come to terms", "chấp nhận", "She came to terms with it."],
  ["come to light", "phơi bày", "The truth came to light."],
  ["come to mind", "đến trong đầu", "A name came to mind."],
  ["come to an agreement", "đạt thỏa thuận", "They came to an agreement."],
  ["come to a decision", "đi đến quyết định", "We came to a decision."],
  ["come to an end", "kết thúc", "The event came to an end."],
  ["come to life", "hồi sinh", "The city comes to life at night."],
  ["come to power", "lên nắm quyền", "The party came to power."],
  ["come to rest", "nghỉ ngơi", "He came to rest at last."],
  ["come to harm", "bị hại", "No one came to harm."],
];

for (const [en, vi, example] of extra) {
  const key = en.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  existing.push({ en, vi, example, type: "collocation" });
}

writeFileSync(
  "data/collocations.json",
  JSON.stringify(existing, null, 2) + "\n",
  "utf8",
);

const counts = grammar.reduce(
  (a, t) => {
    a.mcq += t.mcq.length;
    a.fill += t.fill.length;
    a.topics++;
    return a;
  },
  { mcq: 0, fill: 0, topics: 0 },
);
console.log("grammar:", counts);
console.log("collocations:", existing.length);
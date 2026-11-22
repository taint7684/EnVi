import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Q = { id: number; question: string; options: string[]; answer: number };
type Passage = {
  id: string;
  level: "A2" | "B1" | "B2";
  title: string;
  titleVi: string;
  wordCount: number;
  text: string;
  questions: Q[];
};

function p(
  id: string,
  level: Passage["level"],
  title: string,
  titleVi: string,
  text: string,
  questions: [string, string[], number][],
): Passage {
  const wordCount = text.trim().split(/\s+/).length;
  return {
    id,
    level,
    title,
    titleVi,
    wordCount,
    text,
    questions: questions.map(([q, o, a], i) => ({ id: i + 1, question: q, options: o, answer: a })),
  };
}

const NEW_PASSAGES: Passage[] = [
  // A2
  p("read-a2-18", "A2", "A Day at the Market", "Một Ngày Ở Chợ",
    "Every Saturday, Mai goes to the market with her mother. They buy fresh vegetables, fruit, and fish. The market is small but busy. Mai likes the fruit seller because she always gives a smile. They usually spend about an hour there. After shopping, they stop for a bowl of noodles. Mai carries the lighter bags while her mother carries the heavy ones. On the way home, they talk about the week.",
    [["Who does Mai go to the market with?", ["Her mother", "Her father", "Her teacher", "Her friend"], 0],
     ["When do they go?", ["Every Saturday", "Every Monday", "Every Sunday", "Every Friday"], 0],
     ["What do they buy?", ["Vegetables, fruit and fish", "Books and pens", "Clothes and shoes", "Cars and bikes"], 0],
     ["Why does Mai like the fruit seller?", ["She always gives a smile", "She is rich", "She is young", "She is loud"], 0],
     ["What do they eat after shopping?", ["A bowl of noodles", "A sandwich", "A cake", "Rice with chicken"], 0]]),
  p("read-a2-19", "A2", "My New Neighbour", "Hàng Xóm Mới",
    "Last month, a new family moved in next door. They have two children and a small dog. The father is a doctor and the mother is a nurse. On the first day, they brought some cookies to say hello. My little sister plays with their children in the garden. The dog is friendly but very noisy. We help them find the nearest supermarket. Now we often have dinner together on Sundays.",
    [["When did the family move in?", ["Last month", "Last year", "Last week", "Yesterday"], 0],
     ["How many children do they have?", ["Two", "One", "Three", "Four"], 0],
     ["What job does the mother do?", ["A nurse", "A doctor", "A teacher", "A cook"], 0],
     ["What did they bring on the first day?", ["Cookies", "Flowers", "Fruit", "A cake"], 0],
     ["When do they have dinner together?", ["On Sundays", "On Mondays", "On Fridays", "Every day"], 0]]),
  p("read-a2-20", "A2", "The School Trip", "Chuyến Đi Của Trường",
    "Our class went on a trip to the countryside last Friday. We left school at seven in the morning by bus. The trip took two hours. First, we visited a farm and saw cows and chickens. Then we had lunch near a river. In the afternoon, we played games and took many photos. The weather was sunny and warm. We came back at five and everyone was tired but happy. Our teacher said we will go again next year.",
    [["How did they travel?", ["By bus", "By train", "By car", "By plane"], 0],
     ["What did they see at the farm?", ["Cows and chickens", "Tigers and lions", "Fish and sharks", "Camels and goats"], 0],
     ["Where did they have lunch?", ["Near a river", "In a restaurant", "At school", "On the bus"], 0],
     ["How was the weather?", ["Sunny and warm", "Rainy and cold", "Snowy", "Windy"], 0],
     ["When will they go again?", ["Next year", "Next month", "Next week", "Never"], 0]]),
  p("read-a2-21", "A2", "Cooking with Grandma", "Nấu Ăn Với Bà",
    "My grandmother is the best cook in our family. On weekends, I help her make traditional food. She teaches me how to cook rice, soup, and vegetables. She never uses a recipe because she remembers everything. The kitchen always smells wonderful. Last Sunday, we made spring rolls together. I was slow, but Grandma was patient. She says cooking is a way to show love. I hope to cook as well as her one day.",
    [["Who is the best cook?", ["Grandmother", "Mother", "Father", "Sister"], 0],
     ["When does the writer help?", ["On weekends", "On weekdays", "Every night", "In the morning"], 0],
     ["Why does Grandma not use a recipe?", ["She remembers everything", "She cannot read", "She lost it", "She hates it"], 0],
     ["What did they make last Sunday?", ["Spring rolls", "A cake", "Pizza", "Bread"], 0],
     ["What does Grandma say cooking is?", ["A way to show love", "A waste of time", "A job", "A hobby"], 0]]),
  p("read-a2-22", "A2", "A Rainy Day", "Một Ngày Mưa",
    "Today is Monday and it is raining heavily. I forgot my umbrella, so I got wet on the way to school. The streets are flooded and the traffic is slow. Many students arrived late. Our teacher let us stay inside during break. I sat by the window and read a book. After school, the rain stopped and the sun came out. I walked home and saw a beautiful rainbow. My mother made hot tea when I got home.",
    [["What day is it?", ["Monday", "Tuesday", "Sunday", "Friday"], 0],
     ["Why did the writer get wet?", ["Forgot the umbrella", "No coat", "No shoes", "No bag"], 0],
     ["How was the traffic?", ["Slow", "Fast", "Empty", "Normal"], 0],
     ["What did the writer do during break?", ["Read a book", "Played football", "Slept", "Ate lunch"], 0],
     ["What appeared after the rain?", ["A rainbow", "Snow", "Wind", "Fog"], 0]]),
  p("read-a2-23", "A2", "My Favourite Sport", "Môn Thể Thao Yêu Thích",
    "My favourite sport is swimming. I go to the pool twice a week with my brother. We usually swim for an hour. Swimming makes me strong and healthy. In summer, we also go to the beach. Last month, I joined a swimming club. The coach is very kind and teaches us new styles. I am not the fastest, but I am improving. My goal is to swim one kilometre without stopping.",
    [["What is the favourite sport?", ["Swimming", "Running", "Football", "Cycling"], 0],
     ["How often does the writer go to the pool?", ["Twice a week", "Once a month", "Every day", "Once a year"], 0],
     ["Who goes with the writer?", ["Brother", "Father", "Friend", "Mother"], 0],
     ["What did the writer join last month?", ["A swimming club", "A gym", "A class", "A team"], 0],
     ["What is the goal?", ["Swim one kilometre without stopping", "Win a race", "Swim every day", "Become a coach"], 0]]),
  p("read-a2-24", "A2", "The Lost Wallet", "Chiếc Ví Bị Mất",
    "Yesterday, Mr. Nam lost his wallet on the bus. It had money and important cards inside. He was very worried. A student found the wallet and gave it to the bus driver. The driver called the number on the ID card. Mr. Nam went to the station to get it back. He was so happy that he wanted to give a reward. The student said no thanks and only asked him to be careful next time.",
    [["Where did Mr. Nam lose his wallet?", ["On the bus", "At home", "In a shop", "At school"], 0],
     ["What was inside?", ["Money and cards", "Food", "Books", "Clothes"], 0],
     ["Who found the wallet?", ["A student", "A teacher", "A doctor", "A police officer"], 0],
     ["Who did the student give it to?", ["The bus driver", "The police", "A friend", "The shop owner"], 0],
     ["What did the student ask for?", ["Nothing, just to be careful", "Money", "A reward", "A new wallet"], 0]]),
  p("read-a2-25", "A2", "A Letter to a Friend", "Thư Gửi Bạn",
    "Dear Lan, I am writing from Da Nang where I am on holiday with my family. The beach here is beautiful and the seafood is delicious. Yesterday we visited the Marble Mountains and took many photos. The weather is hot, so we swim every afternoon. In the evening, we walk along the beach and eat ice cream. I wish you were here with us. I will bring you a small gift. See you next week! Your friend, Hoa.",
    [["Where is Hoa on holiday?", ["Da Nang", "Hanoi", "Hue", "Sa Pa"], 0],
     ["What did they visit yesterday?", ["The Marble Mountains", "A museum", "A zoo", "A park"], 0],
     ["When do they swim?", ["Every afternoon", "Every morning", "At night", "Never"], 0],
     ["What will Hoa bring Lan?", ["A small gift", "A book", "Fruit", "A photo"], 0],
     ["When will Hoa see Lan?", ["Next week", "Next month", "Tomorrow", "Next year"], 0]]),
  p("read-a2-26", "A2", "The New Library", "Thư Viện Mới",
    "Our town opened a new library last week. It is a big, modern building with three floors. The ground floor has newspapers and magazines. The first floor has children's books and a play area. The second floor is quiet for studying. There are also computers with free internet. My favourite place is the small cafe on the top floor. I go there every Saturday to read and relax. The library is open from eight in the morning to eight at night.",
    [["When did the library open?", ["Last week", "Last month", "Last year", "Yesterday"], 0],
     ["How many floors does it have?", ["Three", "Two", "Four", "Five"], 0],
     ["Where is the quiet study area?", ["The second floor", "The ground floor", "The first floor", "The top floor"], 0],
     ["What is the writer's favourite place?", ["The cafe", "The play area", "The computer room", "The ground floor"], 0],
     ["When is the library open until?", ["Eight at night", "Eight in the morning", "Six at night", "Ten at night"], 0]]),
  p("read-a2-27", "A2", "My Pet Dog", "Chó Cưng",
    "I have a pet dog named Rex. He is three years old and very friendly. Every morning, I take him for a walk in the park. He loves to run and play with the ball. Rex is afraid of thunder, so he hides under the bed. He eats two meals a day and sleeps a lot. My family loves him very much. He is not just a pet; he is part of our family.",
    [["What is the dog's name?", ["Rex", "Max", "Buddy", "Tom"], 0],
     ["How old is Rex?", ["Three years", "Two years", "Five years", "One year"], 0],
     ["Where does the writer walk him?", ["In the park", "On the beach", "At school", "In the garden"], 0],
     ["What is Rex afraid of?", ["Thunder", "Rain", "Cats", "Cars"], 0],
     ["How many meals does he eat?", ["Two", "One", "Three", "Four"], 0]]),
  // B1
  p("read-b1-18", "B1", "Working from Home", "Làm Việc Tại Nhà",
    "Since last year, many companies have allowed their employees to work from home. There are clear advantages and disadvantages. On the positive side, people save time and money because they do not have to travel to the office every day. They can also have a more flexible schedule and spend more time with their families. However, some people find it difficult to concentrate at home because of noise or distractions. Others feel lonely without their colleagues. Experts suggest that a mix of home and office work might be the best solution for most people.",
    [["What is the main topic?", ["Working from home", "Office design", "Family life", "Travel costs"], 0],
     ["What is one advantage mentioned?", ["Saving time and money", "More meetings", "Higher rent", "Longer hours"], 0],
     ["What is a disadvantage mentioned?", ["Difficulty concentrating", "No internet", "No salary", "No colleagues at all"], 0],
     ["What do experts suggest?", ["A mix of home and office work", "Working only at home", "Working only in the office", "No work at all"], 0],
     ["How do some people feel at home?", ["Lonely", "Excited", "Rich", "Busy"], 0]]),
  p("read-b1-19", "B1", "A Memorable Journey", "Một Chuyến Đi Đáng Nhớ",
    "Two years ago, I travelled to the north of Vietnam with two friends. We planned the trip for weeks, but nothing went as expected. Our bus broke down in the middle of nowhere, and we had to wait for five hours. Just when we thought the trip was ruined, a local family invited us for lunch. They were incredibly kind and showed us a hidden waterfall nearby. We ended up having one of the best days of our lives. Since then, I have learned that sometimes the best moments are the ones you do not plan.",
    [["When did the trip happen?", ["Two years ago", "Last month", "Last year", "Yesterday"], 0],
     ["What went wrong first?", ["The bus broke down", "It rained", "They got lost", "They lost money"], 0],
     ["Who helped them?", ["A local family", "The police", "A teacher", "A hotel manager"], 0],
     ["What did they see?", ["A hidden waterfall", "A museum", "A zoo", "A market"], 0],
     ["What did the writer learn?", ["Best moments are unplanned", "Always plan carefully", "Never travel", "Travel is expensive"], 0]]),
  p("read-b1-20", "B1", "The Value of Reading", "Giá Trị Của Việc Đọc",
    "Reading is one of the most useful habits a person can develop. Unlike watching videos, reading requires us to use our imagination and concentrate for a long time. Studies show that people who read regularly have a larger vocabulary and better memory. Reading also reduces stress; just six minutes of reading can slow the heart rate and relax the muscles. Some people claim they do not have time to read, but in fact, most of us can find at least fifteen minutes a day, for example before bed. The key is to choose books that we genuinely enjoy.",
    [["What does reading require?", ["Imagination and concentration", "Money", "A computer", "Fast movement"], 0],
     ["What do readers have according to studies?", ["Larger vocabulary", "More money", "Better eyesight", "Faster cars"], 0],
     ["How long does it take to reduce stress?", ["Six minutes", "Six hours", "Six days", "One minute"], 0],
     ["How much time can most people find?", ["Fifteen minutes", "Three hours", "One hour", "No time"], 0],
     ["What is the key to reading?", ["Choosing books we enjoy", "Reading fast", "Reading only news", "Buying many books"], 0]]),
  p("read-b1-21", "B1", "A Change of Career", "Đổi Nghề",
    "After ten years as an accountant, Linh decided to change her career. She had always loved cooking, so she enrolled in a cooking course. Her friends thought she was crazy to leave a stable job, but she was determined. The first few months were very hard because she earned much less than before. However, she slowly built a loyal customer base by selling homemade cakes online. Within a year, her small business became profitable. Linh says that although the journey was stressful, she has never felt happier or more fulfilled.",
    [["What was Linh's old job?", ["Accountant", "Teacher", "Doctor", "Engineer"], 0],
     ["What did she love?", ["Cooking", "Driving", "Singing", "Painting"], 0],
     ["How did her friends react?", ["They thought she was crazy", "They were happy", "They helped her", "They ignored her"], 0],
     ["How did she build customers?", ["Selling homemade cakes online", "Opening a restaurant", "Advertising on TV", "Hiring staff"], 0],
     ["How does she feel now?", ["Happier and more fulfilled", "Worried", "Bored", "Angry"], 0]]),
  p("read-b1-22", "B1", "The Power of Habits", "Sức Mạnh Của Thói Quen",
    "Habits shape our lives more than we realise. A habit is an action we repeat so often that our brain performs it automatically, without thinking. This is why it is hard to break bad habits and also why good habits are so powerful. Researchers suggest starting with small changes, such as reading one page a day or walking for ten minutes. These small actions are easy to maintain and gradually become automatic. The secret is consistency rather than intensity. Over time, small habits can lead to remarkable results.",
    [["What is a habit?", ["An action repeated automatically", "A one-time event", "A sudden decision", "A plan"], 0],
     ["Why is it hard to break bad habits?", ["The brain does them automatically", "They are expensive", "They are new", "They are fun"], 0],
     ["What do researchers suggest?", ["Starting with small changes", "Big changes immediately", "No changes", "Only exercise"], 0],
     ["What is the secret?", ["Consistency rather than intensity", "Intensity only", "Money", "Luck"], 0],
     ["What can small habits lead to?", ["Remarkable results", "Nothing", "Failure", "Stress"], 0]]),
  p("read-b1-23", "B1", "The City That Never Sleeps", "Thành Phố Không Ngủ",
    "Living in a big city has both exciting and tiring sides. On one hand, there is always something to do: restaurants, cinemas, concerts, and shopping malls open late. Public transport runs throughout the night, so people can move around easily. On the other hand, the city is noisy and crowded, and the cost of living is high. Many people who move to the city for work eventually feel exhausted by the fast pace. To stay healthy, experts recommend finding quiet green spaces, such as parks, where people can relax and breathe fresh air.",
    [["What is one exciting side?", ["Always something to do", "Quiet streets", "Low cost", "No transport"], 0],
     ["When does public transport run?", ["Throughout the night", "Only in the morning", "Only on weekends", "Never"], 0],
     ["What is a negative side?", ["Noise and crowds", "Empty streets", "Cheap rent", "Clean air"], 0],
     ["Why do some people feel exhausted?", ["The fast pace", "The low cost", "The quiet", "The parks"], 0],
     ["What do experts recommend?", ["Finding quiet green spaces", "Moving away", "Working more", "Avoiding transport"], 0]]),
  p("read-b1-24", "B1", "The First Marathon", "Chạy Marathon Lần Đầu",
    "Running a marathon was a dream that seemed impossible for Tuan. He had never been sporty and could barely run two kilometres. However, after his doctor warned him about his health, he decided to make a change. He started by running short distances three times a week and slowly increased the length. It took him eight months of hard training to be ready. On the day of the race, he was nervous but determined. Although he finished near the back, crossing the finish line was one of the proudest moments of his life.",
    [["What seemed impossible for Tuan?", ["Running a marathon", "Getting a job", "Learning English", "Buying a house"], 0],
     ["Why did he decide to change?", ["His doctor warned him", "His friend asked", "He won money", "He was bored"], 0],
     ["How did he start?", ["Running short distances", "Running a marathon", "Lifting weights", "Swimming"], 0],
     ["How long did he train?", ["Eight months", "Two weeks", "One year", "One month"], 0],
     ["How did he feel at the finish?", ["Proud", "Angry", "Sad", "Bored"], 0]]),
  p("read-b1-25", "B1", "A Dinner to Remember", "Bữa Tối Đáng Nhớ",
    "The dinner was supposed to be simple, but it turned into an unforgettable evening. My parents had invited some old friends whom we had not seen for years. My mother spent the whole afternoon cooking, while my father cleaned the house. Just as the guests arrived, the electricity went out because of a storm. Instead of panicking, we lit candles and continued. The food tasted even better by candlelight, and everyone laughed and shared stories late into the night. It reminded us that the best moments often come from unexpected situations.",
    [["What was the dinner supposed to be?", ["Simple", "Expensive", "A party", "A wedding"], 0],
     ["What happened when guests arrived?", ["The electricity went out", "It started snowing", "The food burned", "A guest left"], 0],
     ["What did they do?", ["Lit candles and continued", "Cancelled the dinner", "Went out", "Slept"], 0],
     ["How did the food taste?", ["Even better by candlelight", "Terrible", "Cold", "Salty"], 0],
     ["What did they do late into the night?", ["Laughed and shared stories", "Argued", "Cleaned", "Went home"], 0]]),
  p("read-b1-26", "B1", "The Internet and Friendship", "Internet Và Tình Bạn",
    "The internet has completely changed the way we make and keep friends. Through social media, we can stay in touch with people across the world and find communities that share our interests. However, some psychologists warn that online friendships can be shallow compared to real ones. They argue that face-to-face communication teaches us important skills, such as reading body language and handling difficult conversations. The healthiest approach, they suggest, is to use the internet as a tool to support real relationships rather than a replacement for them.",
    [["What has changed friendships?", ["The internet", "The weather", "The government", "The economy"], 0],
     ["What can we find online?", ["Communities with shared interests", "Only games", "Nothing useful", "Only news"], 0],
     ["What do psychologists warn about?", ["Online friendships can be shallow", "Online friends are rich", "The internet is slow", "There are no friends"], 0],
     ["What do face-to-face conversations teach?", ["Reading body language", "Typing fast", "Using phones", "Ignoring people"], 0],
     ["What is the healthiest approach?", ["Use the internet to support real relationships", "Only online friends", "No internet", "No real friends"], 0]]),
  p("read-b1-27", "B1", "Learning a New Language", "Học Một Ngôn Ngữ Mới",
    "Learning a new language as an adult is challenging but rewarding. Children seem to learn naturally, while adults often feel embarrassed about making mistakes. However, research shows that adults have advantages too: they can understand grammar rules and learn vocabulary more efficiently. The most important factor is regular practice. Experts recommend speaking as much as possible, even with mistakes, because communication matters more than perfection. Watching films, listening to songs, and reading simple books in the target language also help. With patience and daily effort, anyone can become fluent over time.",
    [["How is learning a language as an adult?", ["Challenging but rewarding", "Impossible", "Easy and boring", "Only for children"], 0],
     ["How do adults often feel about mistakes?", ["Embarrassed", "Proud", "Excited", "Angry"], 0],
     ["What advantage do adults have?", ["They understand grammar rules", "They have more time", "They are younger", "They speak faster"], 0],
     ["What is the most important factor?", ["Regular practice", "Money", "Talent", "Luck"], 0],
     ["What do experts recommend?", ["Speaking as much as possible", "Only reading", "Only grammar", "Avoiding mistakes"], 0]]),
  // B2
  p("read-b2-17", "B2", "The Gig Economy", "Kinh Tế Tự Do",
    "The gig economy, characterised by short-term, flexible jobs rather than permanent contracts, has grown rapidly over the past decade. Supporters argue that it offers workers freedom and companies cost savings. Drivers, freelancers, and delivery workers can choose when and how much they work. Critics, however, point out that gig workers often lack job security, paid leave, and health insurance. Moreover, the lack of a fixed schedule can lead to unpredictable income and chronic stress. Governments around the world are now debating how to regulate this sector, balancing the flexibility that workers value with the protections that traditional employment provides. The outcome of this debate will shape the future of work for millions of people.",
    [["What characterises the gig economy?", ["Short-term flexible jobs", "Permanent contracts", "High salaries", "Government jobs"], 0],
     ["What do supporters value?", ["Freedom and cost savings", "Job security", "Paid leave", "Fixed schedules"], 0],
     ["What do critics emphasise?", ["Lack of job security and benefits", "Too much freedom", "High income", "Fixed hours"], 0],
     ["What are governments debating?", ["How to regulate the sector", "How to ban it", "How to raise taxes", "How to hire workers"], 0],
     ["What will shape the future of work?", ["The outcome of this debate", "The weather", "The stock market", "Education only"], 0]]),
  p("read-b2-18", "B2", "Rethinking Success", "Định Nghĩa Lại Thành Công",
    "For generations, success was measured largely by wealth, status, and career advancement. Recently, however, a growing movement has begun to challenge this narrow definition. Many professionals, particularly younger ones, are prioritising well-being, meaningful work, and time with family over salary and titles. This shift is partly a response to burnout, which has reached alarming levels in many industries. Companies are adapting by offering mental health support, flexible hours, and opportunities for personal growth. While critics argue that ambition still matters, few would disagree that a definition of success which ignores health and happiness is incomplete. The challenge lies in redefining success without losing the drive to achieve.",
    [["How was success traditionally measured?", ["Wealth, status, career", "Happiness", "Free time", "Friendship"], 0],
     ["What are younger professionals prioritising?", ["Well-being and meaningful work", "Money only", "Titles only", "Status"], 0],
     ["What is partly driving the shift?", ["Burnout", "Boredom", "Cheap labour", "Bad weather"], 0],
     ["How are companies adapting?", ["Offering mental health support and flexibility", "Cutting salaries", "Removing benefits", "Ignoring the issue"], 0],
     ["What do critics argue?", ["Ambition still matters", "Success is meaningless", "Health is irrelevant", "Nobody should work"], 0]]),
  p("read-b2-19", "B2", "The Ethics of Artificial Intelligence", "Đạo Đức Của Trí Tuệ Nhân Tạo",
    "As artificial intelligence becomes embedded in everyday life, ethical questions have moved from theory to practice. Algorithms now influence who gets a loan, which job applicants are shortlisted, and even medical diagnoses. The concern is that these systems, trained on historical data, may reproduce and amplify existing biases. A hiring algorithm, for instance, might disadvantage candidates from underrepresented groups if past hiring was skewed. Transparency is another major issue: many AI systems are 'black boxes' whose decisions cannot be easily explained. Policymakers are therefore pushing for regulations that require fairness, accountability, and human oversight. The goal is not to slow innovation, but to ensure that it benefits society as a whole.",
    [["Where have ethical questions moved?", ["From theory to practice", "From practice to theory", "Nowhere", "To history"], 0],
     ["What influences everyday decisions?", ["Algorithms", "Weather", "Luck", "Tradition"], 0],
     ["What may algorithms reproduce?", ["Existing biases", "New jobs", "Cheap labour", "Clean data"], 0],
     ["What is a 'black box' problem?", ["Decisions cannot be explained", "The box is lost", "The screen is dark", "The data is clean"], 0],
     ["What do policymakers push for?", ["Fairness, accountability, oversight", "Less innovation", "No AI", "More secrecy"], 0]]),
  p("read-b2-20", "B2", "A City Without Cars", "Thành Phố Không Xe Hơi",
    "Imagine a city centre where cars are banned and streets belong to pedestrians and cyclists. Several European cities have experimented with this idea, and the results have been surprisingly positive. Air quality improved, noise levels dropped, and local businesses reported higher footfall. Critics initially feared chaos, but well-designed public transport and cycling infrastructure addressed most concerns. Not surprisingly, residents reported feeling healthier and more connected to their community. Of course, such changes require significant investment and political will, which explains why they remain rare. Nevertheless, the experiments suggest that prioritising people over vehicles can transform urban life.",
    [["What is the idea?", ["Banning cars in the city centre", "Banning bicycles", "Building more roads", "Closing shops"], 0],
     ["What improved?", ["Air quality and noise levels", "Traffic jams", "Car sales", "Pollution"], 0],
     ["What did critics initially fear?", ["Chaos", "Cleaner air", "More parks", "Higher profits"], 0],
     ["What addressed concerns?", ["Public transport and cycling infrastructure", "More cars", "Fewer buses", "Higher taxes"], 0],
     ["What do such changes require?", ["Investment and political will", "Nothing", "Less planning", "Fewer people"], 0]]),
  p("read-b2-21", "B2", "The Science of Sleep", "Khoa Học Về Giấc Ngủ",
    "Sleep is not a passive state but an active process essential for health. During deep sleep, the body repairs tissues and strengthens the immune system, while the brain consolidates memories and clears waste. Chronic sleep deprivation, by contrast, is linked to obesity, diabetes, and impaired cognitive function. Yet modern lifestyles often treat sleep as a luxury. Blue light from screens suppresses melatonin, making it harder to fall asleep, while caffeine and irregular schedules disrupt the natural rhythm. Scientists recommend a consistent sleep routine, a dark and cool bedroom, and avoiding screens an hour before bed. Prioritising sleep is one of the most effective ways to improve overall well-being.",
    [["What is sleep?", ["An active essential process", "A passive state", "A waste of time", "A disease"], 0],
     ["What happens during deep sleep?", ["Tissues repair and memories consolidate", "The body stops working", "Nothing", "Muscles grow only"], 0],
     ["What is deprivation linked to?", ["Obesity, diabetes, cognitive issues", "Better memory", "More energy", "Longer life"], 0],
     ["What does blue light do?", ["Suppresses melatonin", "Improves sleep", "Reduces caffeine", "Clears waste"], 0],
     ["What do scientists recommend?", ["Consistent sleep routine", "More screens", "More caffeine", "Irregular schedules"], 0]]),
  p("read-b2-22", "B2", "The Decline of Local Shops", "Sự Suy Giảm Của Cửa Hàng Địa Phương",
    "Over the past two decades, small local shops have been closing at an alarming rate, replaced by large chains and online retailers. While consumers enjoy lower prices and greater convenience, the loss of local businesses has subtle but serious consequences. Local shops keep money circulating within the community, create local jobs, and give neighbourhoods their unique character. They also provide a human touch that algorithms cannot replicate: a friendly conversation, personalised advice, or simply a familiar face. Some towns have responded with initiatives such as 'shop local' campaigns and reduced rents for independent businesses. Whether these efforts can reverse the trend remains uncertain, but the value of preserving local commerce is increasingly recognised.",
    [["What has happened to local shops?", ["They have been closing", "They have grown", "They have moved online only", "They have doubled"], 0],
     ["What do consumers enjoy?", ["Lower prices and convenience", "Higher prices", "Less choice", "Fewer jobs"], 0],
     ["What do local shops provide?", ["Human touch and local jobs", "Only cheap goods", "No community value", "Only parking"], 0],
     ["What have some towns done?", ["Shop local campaigns and reduced rents", "Banned shops", "Closed all shops", "Raised taxes"], 0],
     ["What is increasingly recognised?", ["The value of local commerce", "The end of shopping", "The need for chains", "The uselessness of shops"], 0]]),
  p("read-b2-23", "B2", "Climate Migration", "Di Cư Vì Khí Hậu",
    "Climate change is increasingly forcing people to leave their homes. Rising sea levels, prolonged droughts, and extreme weather events have already displaced millions worldwide. Unlike refugees fleeing war, so-called climate migrants often fall outside existing legal protections, leaving them in a precarious position. Bangladesh, for example, faces both flooding and saltwater intrusion, threatening its agriculture. Meanwhile, drought in the Sahel region is pushing farmers toward cities. Experts warn that climate migration will intensify in coming decades, potentially creating new tensions in receiving regions. They call for international frameworks that recognise climate displacement and provide support, arguing that planning ahead is far cheaper than responding to crises.",
    [["What is forcing people to leave?", ["Climate change", "Better jobs", "Cheaper houses", "Education"], 0],
     ["How are climate migrants different from refugees?", ["They often lack legal protections", "They have more rights", "They are always rich", "They never move"], 0],
     ["What threatens Bangladesh?", ["Flooding and saltwater intrusion", "Snow", "Earthquakes only", "Volcanoes"], 0],
     ["What is happening in the Sahel?", ["Drought pushing farmers to cities", "Heavy rain", "Falling sea levels", "Cold weather"], 0],
     ["What do experts call for?", ["International frameworks and planning", "Doing nothing", "Closing borders", "Ignoring the issue"], 0]]),
  p("read-b2-24", "B2", "The Value of Failure", "Giá Trị Của Thất Bại",
    "In many cultures, failure is seen as something to be avoided and hidden. Yet a growing body of research suggests that failure, when handled constructively, is one of the most powerful engines of learning. Thomas Edison famously said that he had not failed but had found thousands of ways that would not work. In Silicon Valley, entrepreneurs often wear their failures as badges of experience. The key is to treat failure as feedback: analysing what went wrong, adjusting the approach, and trying again. Organisations that punish mistakes tend to breed fear and stagnation, whereas those that encourage intelligent risk-taking foster innovation. Reframing failure is therefore not about lowering standards, but about building resilience.",
    [["How is failure often seen?", ["Something to avoid and hide", "A badge of honour always", "A guarantee of success", "A legal issue"], 0],
     ["What does research suggest?", ["Failure can be an engine of learning", "Failure is always bad", "Failure should be hidden", "Failure means the end"], 0],
     ["How should failure be treated?", ["As feedback", "As a punishment", "As luck", "As fate"], 0],
     ["What happens in organisations that punish mistakes?", ["Fear and stagnation", "Innovation", "Growth", "Happiness"], 0],
     ["What is reframing failure about?", ["Building resilience", "Lowering standards", "Avoiding risk", "Hiding mistakes"], 0]]),
  p("read-b2-25", "B2", "The Future of Work", "Tương Lai Của Công Việc",
    "The nature of work is undergoing its most significant transformation since the industrial revolution. Automation and artificial intelligence are replacing routine tasks, while remote work has blurred the boundary between office and home. Predictions vary widely: some foresee massive unemployment, while others expect new types of jobs to emerge, as has happened with every previous technological shift. What seems clear is that continuous learning will become essential, as the skills required today may be obsolete within a few years. Educational systems will need to adapt, emphasising adaptability, creativity, and collaboration over rote knowledge. Rather than fearing change, societies have an opportunity to design work that is more humane, flexible, and fulfilling.",
    [["What is transforming work?", ["Automation and AI", "The weather", "Population decline", "Fashion"], 0],
     ["What varies in predictions?", ["Views on employment", "The weather", "The date", "The colour"], 0],
     ["What will become essential?", ["Continuous learning", "Physical strength", "Typing speed", "Luck"], 0],
     ["What should education emphasise?", ["Adaptability, creativity, collaboration", "Rote knowledge only", "Memorisation", "Obedience"], 0],
     ["What is the opportunity?", ["Designing more humane work", "Avoiding change", "Reducing pay", "Ending work"], 0]]),
  p("read-b2-26", "B2", "Food Waste", "Lãng Phí Thực Phẩm",
    "Roughly one third of all food produced globally is wasted, a staggering figure given that millions go hungry. The waste occurs at every stage: crops left unharvested, produce rejected for cosmetic reasons, and consumers throwing away edible food. The environmental cost is enormous, as wasted food decomposes in landfills and releases methane, a potent greenhouse gas. Supermarkets are increasingly donating unsold food to charities, while apps now connect restaurants with customers willing to buy surplus meals at a discount. Some countries have even passed laws requiring large retailers to donate rather than discard. Reducing food waste, experts argue, is one of the simplest and most effective ways to combat both hunger and climate change.",
    [["How much food is wasted globally?", ["About one third", "Half", "None", "All of it"], 0],
     ["Why is produce sometimes wasted?", ["Cosmetic reasons", "It is too cheap", "It is too fresh", "It is frozen"], 0],
     ["What gas does wasted food release?", ["Methane", "Oxygen", "Helium", "Nitrogen"], 0],
     ["What are supermarkets doing?", ["Donating unsold food", "Throwing all away", "Raising prices", "Closing"], 0],
     ["What have some countries passed?", ["Laws requiring donation", "Bans on food", "New taxes", "Import limits"], 0]]),
];

type Shadow = {
  id: string;
  youtubeId: string;
  title: string;
  titleVi: string;
  level: string;
  duration: string;
  transcript: Array<{ id: number; startTime: number; endTime: number; text: string }>;
};

function sh(
  id: string,
  title: string,
  titleVi: string,
  level: string,
  lines: string[],
): Shadow {
  const seg = 12;
  return {
    id,
    youtubeId: "dQw4w9WgXcQ",
    title,
    titleVi,
    level,
    duration: `${Math.floor((lines.length * seg) / 60)}:${String((lines.length * seg) % 60).padStart(2, "0")}`,
    transcript: lines.map((text, i) => ({
      id: i + 1,
      startTime: i * seg,
      endTime: (i + 1) * seg,
      text,
    })),
  };
}

const NEW_SHADOWING: Shadow[] = [
  sh("sh-daily-plan", "Planning My Day", "Lập Kế Hoạch Cho Ngày", "A2-B1",
    ["Good morning, everyone. Today I want to share how I plan my day.",
     "I always start by writing a short list of tasks the night before.",
     "In the morning, I check my calendar and choose the top three priorities.",
     "I try to finish the most difficult task first, while my energy is high.",
     "After lunch, I handle emails and smaller jobs that take less focus.",
     "In the evening, I review what I completed and prepare for tomorrow."]),
  sh("sh-email", "Writing a Professional Email", "Viết Email Chuyên Nghiệp", "B1",
    ["A good professional email should be clear and respectful.",
     "Start with a short greeting and state the purpose in the first line.",
     "Use polite phrases such as 'I would like to' or 'Could you please'.",
     "Keep paragraphs short so the reader can scan the message quickly.",
     "Always proofread for spelling and grammar before you send it.",
     "Finally, close with a courteous sign-off and your contact details."]),
  sh("sh-meeting", "Running an Effective Meeting", "Chủ Trì Cuộc Họp Hiệu Quả", "B1-B2",
    ["An effective meeting begins with a clear agenda shared in advance.",
     "Invite only the people who need to be there, and keep the list short.",
     "Start on time and appoint someone to take notes and track actions.",
     "Encourage quieter members to speak, and prevent one person from dominating.",
     "Summarise decisions and assign owners with deadlines before closing.",
     "Send the minutes promptly so everyone knows what happens next."]),
  sh("sh-interview", "Answering Interview Questions", "Trả Lời Câu Hỏi Phỏng Vấn", "B1-B2",
    ["When answering interview questions, structure matters as much as content.",
     "Use the STAR method: situation, task, action, and result.",
     "Be specific about your contribution rather than speaking only about the team.",
     "Quantify your achievements whenever possible with numbers or outcomes.",
     "If you do not know an answer, stay calm and explain how you would find out.",
     "Always prepare two or three thoughtful questions to ask the interviewer."]),
  sh("sh-negotiation", "Negotiating Successfully", "Đàm Phán Thành Công", "B2",
    ["Successful negotiation is not about winning, but about finding mutual value.",
     "Prepare thoroughly by understanding your goals and your limits in advance.",
     "Listen carefully to the other party and acknowledge their concerns.",
     "Separate the people from the problem to keep the discussion constructive.",
     "Focus on interests rather than positions, and explore creative options.",
     "Finally, confirm the agreement clearly to avoid misunderstandings later."]),
  sh("sh-presentation", "Giving a Clear Presentation", "Thuyết Trình Rõ Ràng", "B1-B2",
    ["A clear presentation follows a simple structure: tell them what you will say.",
     "Open with a strong hook that connects to your audience's needs.",
     "Present three main points, each supported by evidence or an example.",
     "Use visuals sparingly to reinforce, not to replace, your words.",
     "Speak slowly, pause after key ideas, and make eye contact.",
     "Close by summarising your message and stating what you want them to do."]),
  sh("sh-feedback", "Giving Constructive Feedback", "Đưa Phản Hồi Xây Dựng", "B1-B2",
    ["Constructive feedback should be specific, timely, and focused on behaviour.",
     "Begin by describing the situation objectively, without judgement.",
     "Explain the impact of the behaviour on the team or the outcome.",
     "Invite the other person's perspective and listen without interrupting.",
     "Agree on a concrete action and a follow-up date together.",
     "End on a positive note, recognising their strengths and potential."]),
  sh("sh-conflict", "Handling Conflict Calmly", "Xử Lý Mâu Thuẫn Bình TĨnh", "B2",
    ["Conflict is natural in any team, but how we handle it makes the difference.",
     "Stay calm and take a moment before responding to a difficult message.",
     "Acknowledge the other person's feelings before presenting your view.",
     "Look for shared goals rather than focusing on who is right or wrong.",
     "Propose a practical solution and be willing to compromise where needed.",
     "If emotions run high, suggest taking a short break and returning later."]),
  sh("sh-social", "Making Small Talk", "Trò Chuyện Xã Giao", "A2-B1",
    ["Small talk is a friendly way to build rapport with people you have just met.",
     "Start with a simple, open question about a shared situation.",
     "Listen actively and respond with follow-up questions to keep the flow.",
     "Share a little about yourself, but avoid dominating the conversation.",
     "Use positive body language, such as smiling and nodding, to show interest.",
     "Close gracefully by thanking the person and wishing them a good day."]),
  sh("sh-reflect", "Reflecting on Your Progress", "Nhìn Lại Tiến Độ Của Bạn", "B1-B2",
    ["Taking time to reflect on your progress is a powerful learning habit.",
     "Ask yourself what went well and why it worked.",
     "Identify one thing you would do differently next time.",
     "Celebrate small wins to stay motivated over the long term.",
     "Set one clear, achievable goal for the coming week.",
     "Review your goals regularly and adjust them as you grow."]),
  sh("sh-apology", "Saying Sorry Properly", "Xin Lỗi Đúng Cách", "A2-B1",
    ["A sincere apology can repair a relationship quickly when done well.",
     "Start by clearly acknowledging what you did wrong, without excuses.",
     "Show that you understand how the other person felt.",
     "Offer a genuine explanation only if it helps, not to defend yourself.",
     "Propose a concrete way to make things right.",
     "Finally, thank the person for their patience and understanding."]),
  sh("sh-directions", "Asking for Directions Politely", "Hỏi Đường Lịch Sự", "A2-B1",
    ["When you ask for directions, a polite opening makes a big difference.",
     "Begin with 'Excuse me' to get the person's attention respectfully.",
     "State clearly where you want to go and how you are travelling.",
     "Listen carefully and repeat the directions back to confirm you understood.",
     "Ask about landmarks or approximate time to avoid getting lost.",
     "Always thank the person warmly before you leave."]),
  sh("sh-phone", "Answering the Phone Professionally", "Trả Lời Điện Thoại Chuyên Nghiệp", "A2-B1",
    ["Answering the phone professionally creates a strong first impression.",
     "Greet the caller and state your name and company clearly.",
     "Ask how you can help and listen without interrupting.",
     "If you need to transfer the call, explain why and where.",
     "Take a message with the caller's name, number, and reason for calling.",
     "End the call politely by confirming the next step and thanking them."]),
];

function main() {
  const rPath = join(process.cwd(), "data", "reading-passages.json");
  const sPath = join(process.cwd(), "data", "shadowing-lessons.json");
  const passages = JSON.parse(readFileSync(rPath, "utf-8")) as Passage[];
  const shadows = JSON.parse(readFileSync(sPath, "utf-8")) as Shadow[];

  const rIds = new Set(passages.map((x) => x.id));
  const addedPassages = NEW_PASSAGES.filter((x) => !rIds.has(x.id));
  const allPassages = [...passages, ...addedPassages];

  const sIds = new Set(shadows.map((x) => x.id));
  const addedShadows = NEW_SHADOWING.filter((x) => !sIds.has(x.id));
  const allShadows = [...shadows, ...addedShadows];

  writeFileSync(rPath, JSON.stringify(allPassages, null, 2) + "\n", "utf-8");
  writeFileSync(sPath, JSON.stringify(allShadows, null, 2) + "\n", "utf-8");

  console.log(`reading: ${passages.length} -> ${allPassages.length} (added ${addedPassages.length})`);
  console.log(`shadowing: ${shadows.length} -> ${allShadows.length} (added ${addedShadows.length})`);

  for (const pp of allPassages) {
    if (!pp.text || pp.questions.length < 3) {
      console.error(`BAD passage ${pp.id}`);
      process.exit(1);
    }
  }
  for (const ss of allShadows) {
    if (!ss.transcript.length) {
      console.error(`BAD shadowing ${ss.id}`);
      process.exit(1);
    }
  }
  if (allPassages.length < 80) {
    console.error(`FAIL reading ${allPassages.length} < 80`);
    process.exit(1);
  }
  if (allShadows.length < 60) {
    console.error(`FAIL shadowing ${allShadows.length} < 60`);
    process.exit(1);
  }
  console.log("OK");
}

main();
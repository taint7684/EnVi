export type Level = "A2" | "B1" | "B2";

export type LevelTopic = {
  id: string;
  label: string;
  levels: Record<Level, string[]>;
};

export const SPEAKING_QUESTIONS_BY_LEVEL: LevelTopic[] = [
  {
    id: "daily-routine",
    label: "Daily Routine",
    levels: {
      A2: [
        "What time do you usually wake up?",
        "What do you usually eat for breakfast?",
        "How do you go to work or school?",
        "What do you do after work or school?",
        "What time do you usually go to bed?",
      ],
      B1: [
        "How does your weekend routine differ from your weekday routine?",
        "Tell me about a typical day in your life.",
        "What is your favorite time of day? Why?",
        "Do you think it is important to have a daily routine? Why or why not?",
        "What would you like to change about your daily routine?",
      ],
      B2: [
        "What are the trade-offs between a fixed routine and a flexible one?",
        "How has your daily routine changed over the past five years?",
        "Do you think morning people are more productive than night owls? Why?",
        "How does technology affect your daily routine?",
        "If you could design your perfect day, what would it look like?",
      ],
    },
  },
  {
    id: "hobbies",
    label: "Hobbies",
    levels: {
      A2: [
        "What do you like to do in your free time?",
        "When did you start this hobby?",
        "Why do you enjoy this activity?",
        "Do you do your hobby alone or with other people?",
        "How often do you practice your hobby?",
      ],
      B1: [
        "Tell me about a hobby you would like to try in the future.",
        "How do hobbies help people relax?",
        "Do you think expensive hobbies are better than free ones? Why?",
        "Have you ever given up a hobby? Why?",
        "What hobby is popular in your country?",
      ],
      B2: [
        "How can hobbies help someone develop new skills for work?",
        "Do you think people spend too much time on hobbies instead of work?",
        "How have hobbies changed with the internet and social media?",
        "Should children be encouraged to have many different hobbies? Why?",
        "Is it better to have one hobby you master or many hobbies you enjoy?",
      ],
    },
  },
  {
    id: "food",
    label: "Food & Cooking",
    levels: {
      A2: [
        "What is your favorite food? Why do you like it?",
        "Do you like cooking? What can you cook?",
        "What did you eat for dinner yesterday?",
        "Do you prefer eating at home or in a restaurant?",
        "What is your favorite drink?",
      ],
      B1: [
        "Tell me about a famous dish from your country.",
        "Do you like trying new foods? Why or why not?",
        "Who cooks in your family?",
        "Is it important to eat healthy food every day? Why?",
        "What is the best restaurant you have been to?",
      ],
      B2: [
        "How does food reflect the culture of a country?",
        "Should schools teach children how to cook? Why or why not?",
        "Is fast food becoming too popular in your country? Why?",
        "Do you think organic food is worth the higher price?",
        "How will food production change in the future?",
      ],
    },
  },
  {
    id: "family",
    label: "Family",
    levels: {
      A2: [
        "How many people are there in your family?",
        "Who are you closest to in your family?",
        "Do you have any brothers or sisters?",
        "Where do your parents live?",
        "Do you live with your family?",
      ],
      B1: [
        "What do you usually do with your family on weekends?",
        "Do you look like your mother or your father?",
        "Who is the oldest person in your family?",
        "Do you enjoy spending time with your family? Why?",
        "Is it important to have family dinners together? Why?",
      ],
      B2: [
        "How has the concept of family changed in your country?",
        "Should elderly parents live with their children or separately?",
        "How do family expectations affect career choices?",
        "Is it better to grow up in a big family or a small family?",
        "What role do grandparents play in modern families?",
      ],
    },
  },
  {
    id: "shopping",
    label: "Shopping",
    levels: {
      A2: [
        "Do you like shopping? Why or why not?",
        "Where do you usually buy clothes?",
        "What was the last thing you bought?",
        "Do you prefer shopping online or in stores?",
        "What do you want to buy next?",
      ],
      B1: [
        "How much money do you usually spend on shopping?",
        "Do you like looking for sales and discounts?",
        "What is your favorite shop or mall?",
        "Do you shop alone or with friends?",
        "Is it easy to find good products in your city?",
      ],
      B2: [
        "How has online shopping changed the way people buy things?",
        "Should people buy fewer things to protect the environment?",
        "Is it better to shop at local stores or big supermarkets?",
        "How does advertising affect what people buy?",
        "Will physical stores disappear in the future?",
      ],
    },
  },
  {
    id: "health",
    label: "Health & Fitness",
    levels: {
      A2: [
        "Do you exercise regularly? What kind of exercise?",
        "How many hours do you sleep every night?",
        "Do you eat healthy food every day?",
        "Do you drink enough water?",
        "Do you like going to the gym?",
      ],
      B1: [
        "How do you stay healthy?",
        "Do you go for walks often?",
        "Do you like sports? Which sports?",
        "Do you eat a lot of vegetables?",
        "Do you think health is important? Why?",
      ],
      B2: [
        "Should governments do more to promote public health?",
        "Is it harder to stay healthy in cities than in villages?",
        "How does stress affect people's health in your country?",
        "Should unhealthy food be taxed more?",
        "What is the best way to encourage people to exercise?",
      ],
    },
  },
  {
    id: "weather",
    label: "Weather & Seasons",
    levels: {
      A2: [
        "What is the weather like today?",
        "What is your favorite season? Why?",
        "Do you like hot weather or cold weather?",
        "What do you usually do on rainy days?",
        "Does it snow in your country?",
      ],
      B1: [
        "What is the best season to visit your country?",
        "Do you like sunshine?",
        "What do you wear in winter?",
        "Does the weather affect your mood?",
        "What is the hottest month in your country?",
      ],
      B2: [
        "How is climate change affecting weather in your country?",
        "Should people change their lifestyle because of climate change?",
        "How does weather affect the economy of your country?",
        "Is it better to live in a place with four seasons or one season?",
        "What can individuals do to help the environment?",
      ],
    },
  },
  {
    id: "housing",
    label: "Housing",
    levels: {
      A2: [
        "Do you live in a house or an apartment?",
        "How many rooms does your home have?",
        "What is your favorite room in your house?",
        "Do you have a garden or balcony?",
        "Do you own your home or rent it?",
      ],
      B1: [
        "What can you see from your window?",
        "Do you like your neighborhood?",
        "Who do you live with?",
        "Would you like to move to a new house?",
        "What furniture do you like most in your home?",
      ],
      B2: [
        "Is it better to rent or buy a home? Why?",
        "How has housing changed in your city over the past decade?",
        "Should governments provide affordable housing for everyone?",
        "What makes a neighborhood a good place to live?",
        "Will people live in smaller homes in the future?",
      ],
    },
  },
  {
    id: "transport",
    label: "Transport",
    levels: {
      A2: [
        "How do you usually go to work or school?",
        "Do you like using public transport?",
        "Do you drive a car or ride a motorbike?",
        "How long does it take you to get to work?",
        "Do you like walking?",
      ],
      B1: [
        "Have you ever taken a taxi?",
        "Is traffic bad in your city?",
        "Do you like riding a bicycle?",
        "What is your favorite way to travel?",
        "Do you think public transport is cheap?",
      ],
      B2: [
        "Should governments encourage people to use public transport more?",
        "How will transportation change in the future?",
        "Is it better to have a car or use public transport in a big city?",
        "What are the environmental effects of too many cars?",
        "Should cities ban cars from the center?",
      ],
    },
  },
  {
    id: "technology",
    label: "Everyday Tech",
    levels: {
      A2: [
        "Do you use a smartphone every day?",
        "What apps do you use most often?",
        "Do you like using social media?",
        "How many hours do you spend on the internet?",
        "Do you shop online?",
      ],
      B1: [
        "Do you play games on your phone?",
        "Do you use a computer for work?",
        "Do you think technology makes life easier?",
        "What is your favorite website?",
        "Do you watch videos online every day?",
      ],
      B2: [
        "How has technology changed the way people communicate?",
        "Should there be limits on screen time for children?",
        "Do you think artificial intelligence will replace many jobs?",
        "Is it important to understand how technology works?",
        "How can we protect our privacy online?",
      ],
    },
  },
  {
    id: "work",
    label: "Workplace",
    levels: {
      A2: [
        "What do you do for work?",
        "Where do you work?",
        "Do you like your job? Why?",
        "What time do you start work?",
        "Do you work with other people?",
      ],
      B1: [
        "Tell me about your colleagues.",
        "What is a typical day at work like?",
        "Do you prefer working alone or in a team?",
        "What skills are important for your job?",
        "Would you like to change your job? Why?",
      ],
      B2: [
        "How can companies make employees happier at work?",
        "Is it better to work for a big company or a small company?",
        "How has remote work changed the workplace?",
        "Should employees work four days a week instead of five?",
        "What qualities make a good manager?",
      ],
    },
  },
  {
    id: "job-interview",
    label: "Job Interview",
    levels: {
      A2: [
        "Why do you want this job?",
        "What are your strengths?",
        "What are your weaknesses?",
        "Where do you see yourself in five years?",
        "Why should we hire you?",
      ],
      B1: [
        "Tell me about a challenge you faced at work.",
        "How do you handle stress?",
        "Why did you leave your last job?",
        "What salary do you expect?",
        "Do you have any questions for us?",
      ],
      B2: [
        "How do you handle conflict with a colleague?",
        "Describe a time you made a difficult decision.",
        "How do you prioritize tasks when everything is urgent?",
        "What would you do in your first 90 days?",
        "Why are you the best candidate for this position?",
      ],
    },
  },
  {
    id: "email",
    label: "Emails",
    levels: {
      A2: [
        "Do you write emails at work?",
        "How often do you check your email?",
        "Do you prefer email or phone calls?",
        "What do you write in a subject line?",
        "Do you write work emails in English or Vietnamese?",
      ],
      B1: [
        "How do you start a formal email?",
        "What makes a good email subject line?",
        "Do you find it hard to write emails in English?",
        "How do you end a professional email politely?",
        "What should you do before sending an important email?",
      ],
      B2: [
        "How has email changed workplace communication over the years?",
        "Is it better to call someone or send an email for urgent matters?",
        "How can companies reduce unnecessary emails?",
        "Should employees reply to emails outside working hours?",
        "How do you write a clear email to a difficult client?",
      ],
    },
  },
  {
    id: "meetings",
    label: "Meetings",
    levels: {
      A2: [
        "Do you like meetings? Why?",
        "How often do you have meetings?",
        "Do you speak in meetings?",
        "Are meetings long or short?",
        "Do you take notes in meetings?",
      ],
      B1: [
        "What makes a good meeting?",
        "Do you think some meetings are a waste of time?",
        "How do you prepare for a meeting?",
        "Do you prefer online or in-person meetings?",
        "What should a meeting leader do?",
      ],
      B2: [
        "How can meetings be more productive?",
        "Should all meetings have a clear agenda?",
        "Is it better to have fewer, longer meetings or many short ones?",
        "How do you handle someone who talks too much in a meeting?",
        "Are meetings necessary for good teamwork?",
      ],
    },
  },
  {
    id: "deadlines",
    label: "Deadlines & Projects",
    levels: {
      A2: [
        "Do you have deadlines at work?",
        "Do you finish your work on time?",
        "What do you do if you have too much work?",
        "Do you like working under pressure?",
        "How do you plan your tasks?",
      ],
      B1: [
        "How do you manage a tight deadline?",
        "What do you do when a project is running late?",
        "How do you prioritize tasks with many deadlines?",
        "What happens if you miss a deadline?",
        "Do you prefer working on one project or many at once?",
      ],
      B2: [
        "How do you balance quality and speed when a deadline is close?",
        "What should a manager do when the team will miss a deadline?",
        "How can companies set realistic deadlines?",
        "Is it better to finish early or use all the available time?",
        "How has technology changed the way teams meet deadlines?",
      ],
    },
  },
  {
    id: "it-support",
    label: "IT Support",
    levels: {
      A2: [
        "Do you work in IT support?",
        "What do you do when your computer has a problem?",
        "Do you help colleagues with technical issues?",
        "How do you describe a technical problem?",
        "Do you like solving technical problems?",
      ],
      B1: [
        "How do you troubleshoot a computer issue?",
        "What information do you need to solve a support ticket?",
        "How do you explain a technical problem to a non-technical person?",
        "What is the most common IT issue at work?",
        "How do you prioritize support requests?",
      ],
      B2: [
        "How can IT support teams improve customer satisfaction?",
        "Should companies invest more in self-service support tools?",
        "How do you handle an angry customer with a technical problem?",
        "What skills does a good IT support person need?",
        "How has remote work changed IT support?",
      ],
    },
  },
  {
    id: "coding",
    label: "Coding & Dev",
    levels: {
      A2: [
        "Do you write code?",
        "What programming languages do you know?",
        "Do you like coding?",
        "How do you learn new programming skills?",
        "Do you work on a development team?",
      ],
      B1: [
        "What is your favorite programming language? Why?",
        "How do you debug a problem in your code?",
        "What is a code review?",
        "How do you keep your code clean and readable?",
        "What is the difference between frontend and backend?",
      ],
      B2: [
        "How do you balance technical debt and new features?",
        "What makes code maintainable in the long term?",
        "How has artificial intelligence changed the way developers write code?",
        "Should developers write tests before or after the code?",
        "How do you handle disagreements about technical decisions in a team?",
      ],
    },
  },
  {
    id: "remote-work",
    label: "Remote Work",
    levels: {
      A2: [
        "Do you work from home or in an office?",
        "Do you like working from home?",
        "What tools do you use for online meetings?",
        "How do you stay focused at home?",
        "Do you miss working with your team?",
      ],
      B1: [
        "What are the advantages of working from home?",
        "How do you separate work and personal life at home?",
        "Do you think remote work is productive?",
        "What problems can happen in remote work?",
        "How do you communicate with your team when remote?",
      ],
      B2: [
        "Is remote work better than office work for productivity?",
        "How can companies keep remote employees engaged?",
        "What are the long-term effects of remote work on society?",
        "Should employees have the right to work remotely?",
        "How do you build team culture in a remote company?",
      ],
    },
  },
  {
    id: "career",
    label: "Career Growth",
    levels: {
      A2: [
        "Do you have a career plan?",
        "What job would you like to have in the future?",
        "Do you learn new skills for your job?",
        "Do you have a mentor?",
        "What is your dream job?",
      ],
      B1: [
        "How do you set career goals?",
        "What skills do you want to improve?",
        "Is it important to change jobs to grow?",
        "How do you learn new skills at work?",
        "What is the difference between a job and a career?",
      ],
      B2: [
        "How can a company help employees grow their careers?",
        "Is it better to be a specialist or a generalist?",
        "How has the job market changed in the last ten years?",
        "Should people stay in one company for their whole career?",
        "How do you recover from a career setback?",
      ],
    },
  },
  {
    id: "business-english",
    label: "Business English",
    levels: {
      A2: [
        "Do you use English at work?",
        "Do you write business emails in English?",
        "Do you attend meetings in English?",
        "What business words do you know?",
        "Do you feel confident speaking English at work?",
      ],
      B1: [
        "How do you negotiate with a client in English?",
        "What phrases do you use to sound polite in business?",
        "How do you disagree politely in a meeting?",
        "What is the difference between formal and informal business English?",
        "How do you close a deal in English?",
      ],
      B2: [
        "How can non-native speakers improve their business English?",
        "Is it fair that English is the global language of business?",
        "How do you handle a difficult negotiation in a foreign language?",
        "What are the most important business English skills for an IT professional?",
        "How has remote work changed business communication in English?",
      ],
    },
  },
  {
    id: "travel",
    label: "Travel",
    levels: {
      A2: [
        "Do you like traveling?",
        "Where did you go on your last trip?",
        "Do you prefer traveling alone or with others?",
        "What do you take with you when you travel?",
        "Have you ever traveled by plane?",
      ],
      B1: [
        "Tell me about a memorable trip you took.",
        "Do you prefer beach holidays or city trips?",
        "How do you plan a trip?",
        "What is the best way to save money when traveling?",
        "What problems can happen when you travel abroad?",
      ],
      B2: [
        "How has tourism changed in the last ten years?",
        "Should governments limit the number of tourists?",
        "Is it better to travel independently or with a tour group?",
        "How does travel help people understand other cultures?",
        "How will travel change in the future?",
      ],
    },
  },
  {
    id: "airport",
    label: "Airport",
    levels: {
      A2: [
        "Have you ever been to an airport?",
        "Do you like traveling by plane?",
        "What do you do at check-in?",
        "Do you have a passport?",
        "Do you prefer a window or an aisle seat?",
      ],
      B1: [
        "What happens at airport security?",
        "How do you handle a flight delay?",
        "What do you do if you miss your flight?",
        "How do you find your gate?",
        "What should you do if your luggage is lost?",
      ],
      B2: [
        "How has airport security changed over the years?",
        "Should airports be allowed to limit passenger numbers?",
        "How do you deal with a long layover?",
        "What makes a good airport experience?",
        "How will airports change in the future?",
      ],
    },
  },
  {
    id: "hotel",
    label: "Hotel",
    levels: {
      A2: [
        "Do you stay in hotels when you travel?",
        "What do you like about a good hotel?",
        "Do you book hotels online?",
        "What is your favorite type of hotel room?",
        "Have you ever had a problem at a hotel?",
      ],
      B1: [
        "How do you check in at a hotel?",
        "What do you do if your room is not ready?",
        "How do you complain about a hotel service?",
        "What amenities do you look for in a hotel?",
        "How do you find a good hotel deal?",
      ],
      B2: [
        "How has online booking changed the hotel industry?",
        "Should hotels be rated by stars or by guest reviews?",
        "How do you handle a serious problem during a hotel stay?",
        "What makes a hotel truly excellent?",
        "How will technology change hotels in the future?",
      ],
    },
  },
  {
    id: "restaurant",
    label: "Restaurant",
    levels: {
      A2: [
        "Do you like eating at restaurants?",
        "What is your favorite type of restaurant?",
        "Do you book a table before going?",
        "What do you usually order?",
        "Do you leave a tip?",
      ],
      B1: [
        "How do you order food in English?",
        "What do you do if your order is wrong?",
        "Do you prefer fast food or fine dining?",
        "How do you ask for the bill?",
        "What is the most expensive meal you have had?",
      ],
      B2: [
        "How has the restaurant industry changed with delivery apps?",
        "Should restaurants be required to show calorie information?",
        "How do you handle bad service at a restaurant?",
        "What makes a restaurant memorable?",
        "How will technology change the way we dine out?",
      ],
    },
  },
  {
    id: "directions",
    label: "Directions",
    levels: {
      A2: [
        "Do you know how to ask for directions?",
        "Do you use a map on your phone?",
        "Is it easy to find your way in a new city?",
        "What do you do if you get lost?",
        "Do you like exploring new places?",
      ],
      B1: [
        "How do you ask for directions politely?",
        "What phrases do you use to give directions?",
        "Have you ever been lost in a foreign city?",
        "How do you prepare before traveling to a new place?",
        "Do you trust GPS or people more for directions?",
      ],
      B2: [
        "How has GPS changed the way people navigate?",
        "Should cities be designed to be more walkable?",
        "How do you handle getting lost in an unfamiliar place?",
        "What are the advantages of asking locals for directions?",
        "How will navigation technology change in the future?",
      ],
    },
  },
  {
    id: "social",
    label: "Socializing",
    levels: {
      A2: [
        "Do you like meeting new people?",
        "Where do you usually meet friends?",
        "Do you prefer small groups or big parties?",
        "What do you talk about when you meet someone new?",
        "Do you make friends easily?",
      ],
      B1: [
        "How do you start a conversation with a stranger?",
        "What do you do at a social event where you know nobody?",
        "How do you keep in touch with old friends?",
        "Do you prefer online or face-to-face socializing?",
        "What makes someone a good friend?",
      ],
      B2: [
        "How has social media changed the way people make friends?",
        "Is it harder to make friends as an adult?",
        "How do cultural differences affect socializing?",
        "Should people have many friends or a few close ones?",
        "How can someone overcome shyness in social situations?",
      ],
    },
  },
  {
    id: "small-talk",
    label: "Small Talk",
    levels: {
      A2: [
        "Do you make small talk with strangers?",
        "What topics do you talk about with people you just met?",
        "Do you like talking about the weather?",
        "Is small talk common in your country?",
        "Do you feel comfortable making small talk in English?",
      ],
      B1: [
        "How do you keep a small talk conversation going?",
        "What topics should you avoid in small talk?",
        "How do you end a conversation politely?",
        "Is small talk important in business?",
        "How do you make small talk with someone you find difficult?",
      ],
      B2: [
        "Why is small talk considered an important social skill?",
        "How do cultural differences affect small talk?",
        "Can small talk lead to meaningful relationships?",
        "How has remote work reduced opportunities for small talk?",
        "How can someone become better at small talk?",
      ],
    },
  },
  {
    id: "dating",
    label: "Dating & Relationships",
    levels: {
      A2: [
        "Have you ever been on a date?",
        "What do you look for in a partner?",
        "Where is a good place for a first date?",
        "Do you believe in love at first sight?",
        "How do you meet new people?",
      ],
      B1: [
        "How has dating changed with apps?",
        "What is important in a relationship?",
        "How do you handle a disagreement with your partner?",
        "Do you believe in long-distance relationships?",
        "What makes a relationship last?",
      ],
      B2: [
        "How has online dating changed modern relationships?",
        "Should couples share all their passwords and accounts?",
        "How do cultural differences affect relationships?",
        "Is it better to marry young or wait until you are older?",
        "How do you maintain a healthy relationship over time?",
      ],
    },
  },
  {
    id: "culture",
    label: "Culture & Customs",
    levels: {
      A2: [
        "Are you interested in other cultures?",
        "What is a famous custom in your country?",
        "Do you like trying food from other countries?",
        "What cultural differences have you noticed?",
        "Do you celebrate any special holidays?",
      ],
      B1: [
        "How do you adapt to a new culture?",
        "What is a custom you find interesting from another country?",
        "How important is it to respect local customs when traveling?",
        "What are some common misunderstandings between cultures?",
        "How does your culture influence your daily life?",
      ],
      B2: [
        "How does globalization affect local cultures?",
        "Should immigrants be expected to adopt the local culture?",
        "How can people avoid cultural misunderstandings?",
        "Is it possible to preserve a culture in a modern world?",
        "How has the internet changed cultural exchange?",
      ],
    },
  },
  {
    id: "emergencies",
    label: "Emergencies",
    levels: {
      A2: [
        "Do you know what to do in an emergency?",
        "What emergency numbers do you know?",
        "Have you ever been in an emergency situation?",
        "Do you carry a first aid kit?",
        "Who would you call in an emergency?",
      ],
      B1: [
        "How do you stay calm in an emergency?",
        "What should you do if someone is injured?",
        "How do you prepare for an emergency while traveling?",
        "What is the most important thing to have in an emergency?",
        "How do you communicate in an emergency if you do not speak the language?",
      ],
      B2: [
        "How can people be better prepared for emergencies?",
        "Should everyone learn basic first aid?",
        "How do emergency services vary around the world?",
        "What is the role of technology in emergency response?",
        "How do you handle panic in a crisis situation?",
      ],
    },
  },
];

export function getLevelTopic(topicId: string): LevelTopic | undefined {
  return SPEAKING_QUESTIONS_BY_LEVEL.find((t) => t.id === topicId);
}

export function getLevelQuestions(
  topicId: string,
  level: Level,
): string[] {
  const topic = getLevelTopic(topicId);
  if (!topic) return [];
  return (topic.levels[level] ?? []).slice(0, 5);
}

export const SPEAKING_TOPICS = SPEAKING_QUESTIONS_BY_LEVEL.map((t) => ({
  id: t.id,
  label: t.label,
}));

export const LEVEL_LABELS: Record<Level, string> = {
  A2: "A2 — Cơ bản",
  B1: "B1 — Trung cấp",
  B2: "B2 — Trung cấp nâng cao",
};
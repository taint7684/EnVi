// 3000 Most Common English Words (Oxford 3000 subset)
// Used for Placement Test vocabulary filtering

export const OXFORD_3000 = new Set([
  // A1 Core (first 1000)
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
  "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
  "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
  "is", "are", "was", "were", "been", "being", "am", "has", "had", "does",
  "did", "doing", "done", "goes", "went", "gone", "going", "says", "said", "saying",
  "makes", "made", "making", "takes", "took", "taken", "taking", "comes", "came", "come",
  "gets", "got", "gotten", "getting", "sees", "saw", "seen", "seeing", "knows", "knew",
  "known", "knowing", "thinks", "thought", "thinking", "looks", "looked", "looking", "wants", "wanted",
  "wanting", "uses", "used", "using", "works", "worked", "working", "gives", "gave", "given",
  "giving", "finds", "found", "finding", "tells", "told", "telling", "asks", "asked", "asking",
  "needs", "needed", "needing", "tries", "tried", "trying", "helps", "helped", "helping", "lets", "let",
  "lets", "letting", "begins", "began", "begun", "beginning", "keeps", "kept", "keeping", "starts", "started",
  "starting", "shows", "showed", "shown", "showing", "hears", "heard", "hearing", "plays", "played",
  "playing", "runs", "ran", "run", "running", "moves", "moved", "moving", "lives", "lived",
  "living", "believes", "believed", "believing", "brings", "brought", "bringing", "writes", "wrote",
  "written", "writing", "sits", "sat", "sitting", "stands", "stood", "standing", "loses", "lost",
  "losing", "pays", "paid", "paying", "meets", "met", "meeting", "includes", "included", "including",
  "continues", "continued", "continuing", "sets", "set", "setting", "learns", "learned", "learnt",
  "learning", "changes", "changed", "changing", "leads", "led", "leading", "understands", "understood",
  "understanding", "watches", "watched", "watching", "follows", "followed", "following", "stops", "stopped",
  "stopping", "creates", "created", "creating", "speaks", "spoke", "spoken", "speaking", "reads", "read",
  "reading", "allows", "allowed", "allowing", "adds", "added", "adding", "spends", "spent", "spending",
  "grows", "grew", "grown", "growing", "opens", "opened", "opening", "walks", "walked", "walking",
  "wins", "won", "winning", "offers", "offered", "offering", "remembers", "remembered", "remembering",
  "loves", "loved", "loving", "considers", "considered", "considering", "appears", "appeared", "appearing",
  "buys", "bought", "buying", "waits", "waited", "waiting", "serves", "served", "serving", "dies", "died",
  "dying", "sends", "sent", "sending", "expects", "expected", "expecting", "builds", "built", "building",
  "stays", "stayed", "staying", "falls", "fell", "fallen", "falling", "cuts", "cut", "cutting",
  "reaches", "reached", "reaching", "kills", "killed", "killing", "remains", "remained", "remaining",
  "lets", "let", "letting", "becomes", "became", "become", "becoming", "happens", "happened", "happening",
  "exists", "existed", "existing", "helps", "helped", "helping", "provides", "provided", "providing",
  "results", "resulted", "resulting", "requires", "required", "requiring", "decides", "decided", "deciding",
  "explains", "explained", "explaining", "feels", "felt", "feeling", "follows", "followed", "following",
  "reports", "reported", "reporting", "suggests", "suggested", "suggesting", "contains", "contained",
  "containing", "produces", "produced", "producing", "supports", "supported", "supporting", "means", "meant",
  "meaning", "discusses", "discussed", "discussing", "improves", "improved", "improving", "reduces", "reduced",
  "reducing", "achieves", "achieved", "achieving", "prevents", "prevented", "preventing", "creates", "created",
  "creating", "allows", "allowed", "allowing", "offers", "offered", "offering", "maintains", "maintained",
  "maintaining", "increases", "increased", "increasing", "decreases", "decreased", "decreasing", "changes",
  "changed", "changing", "develops", "developed", "developing", "establishes", "established", "establishing",
  "focuses", "focused", "focusing", "involves", "involved", "involving", "presents", "presented", "presenting",
  "represents", "represented", "representing", "shows", "showed", "shown", "showing", "demonstrates", "demonstrated",
  "demonstrating", "indicates", "indicated", "indicating", "suggests", "suggested", "suggesting", "proves", "proved",
  "proven", "proving", "assumes", "assumed", "assuming", "attempts", "attempted", "attempting", "experiences", "experienced",
  "experiencing", "faces", "faced", "facing", "gains", "gained", "gaining", "handles", "handled", "handling",
  "identifies", "identified", "identifying", "manages", "managed", "managing", "measures", "measured", "measuring",
  "operates", "operated", "operating", "performs", "performed", "performing", "prefers", "preferred", "preferring",
  "provides", "provided", "providing", "receives", "received", "receiving", "refers", "referred", "referring",
  "relates", "related", "relating", "requires", "required", "requiring", "responds", "responded", "responding",
  "seeks", "sought", "seeking", "selects", "selected", "selecting", "solves", "solved", "solving", "specifies", "specified",
  "specifying", "supports", "supported", "supporting", "uses", "used", "using", "utilizes", "utilized", "utilizing",
  
  // A1-A2 Common nouns, verbs, adjectives, adverbs
  "about", "above", "across", "after", "against", "along", "among", "around", "before", "behind",
  "below", "beneath", "beside", "between", "beyond", "despite", "during", "except", "inside", "near",
  "outside", "through", "throughout", "toward", "under", "underneath", "until", "upon", "within", "without",
  "I", "you", "he", "she", "it", "we", "they", "me", "him", "her",
  "us", "them", "my", "your", "his", "her", "its", "our", "their", "mine",
  "yours", "hers", "ours", "theirs", "myself", "yourself", "himself", "herself", "itself", "ourselves",
  "yourselves", "themselves", "who", "whom", "whose", "which", "what", "that", "this", "these",
  "those", "here", "there", "where", "when", "why", "how", "all", "any", "both",
  "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not",
  "only", "own", "same", "so", "than", "too", "very", "can", "will", "just",
  "don't", "should", "now", "d", "ll", "m", "o", "re", "ve", "y",
  "ain", "aren", "couldn", "didn", "doesn", "hadn", "hasn", "haven", "isn", "ma",
  "mightn", "mustn", "needn", "shan", "shouldn", "wasn", "weren", "won", "wouldn",
  
  // Common words continuation
  "ability", "able", "about", "above", "accept", "according", "account", "across", "act", "action",
  "activity", "actually", "add", "address", "administration", "admit", "adult", "affect", "after", "again",
  "against", "age", "agency", "agent", "ago", "agree", "agreement", "ahead", "air", "all",
  "allow", "almost", "alone", "along", "already", "also", "although", "always", "American", "among",
  "amount", "analysis", "and", "animal", "another", "answer", "any", "anyone", "anything", "appear",
  "apply", "approach", "area", "argue", "arm", "around", "arrive", "art", "article", "artist",
  "as", "ask", "assume", "at", "attack", "attention", "attorney", "audience", "author", "authority",
  "available", "avoid", "away", "baby", "back", "bad", "bag", "ball", "bank", "base",
  "be", "beat", "beautiful", "because", "become", "bed", "been", "before", "begin", "behavior",
  "behind", "believe", "benefit", "best", "better", "between", "beyond", "big", "bill", "billion",
  "bit", "black", "blood", "blue", "board", "body", "book", "born", "both", "box",
  "boy", "break", "bring", "brother", "budget", "build", "building", "business", "but", "buy",
  "by", "call", "camera", "campaign", "can", "cancer", "candidate", "capital", "car", "card",
  "care", "career", "carry", "case", "catch", "cause", "cell", "center", "central", "century",
  "certain", "certainly", "chair", "challenge", "chance", "change", "character", "charge", "check", "child",
  "choice", "choose", "church", "citizen", "city", "civil", "claim", "class", "clear", "clearly",
  "close", "coach", "cold", "collection", "college", "color", "come", "commercial", "common", "community",
  "company", "compare", "computer", "concern", "condition", "conference", "Congress", "consider", "consumer", "contain",
  "continue", "control", "cost", "could", "country", "couple", "course", "court", "cover", "create",
  "crime", "cultural", "culture", "cup", "current", "customer", "cut", "dark", "data", "daughter",
  "day", "dead", "deal", "death", "debate", "decade", "decide", "decision", "deep", "defense",
  "degree", "Democrat", "democratic", "describe", "design", "despite", "detail", "determine", "develop", "development",
  "die", "difference", "different", "difficult", "dinner", "direction", "director", "discover", "discuss", "discussion",
  "disease", "do", "doctor", "dog", "door", "down", "draw", "dream", "drive", "drop",
  "drug", "during", "each", "early", "east", "easy", "eat", "economic", "economy", "edge",
  "education", "effect", "effort", "eight", "either", "election", "else", "employee", "end", "energy",
  "enjoy", "enough", "enter", "entire", "environment", "environmental", "especially", "establish", "even", "evening",
  "event", "ever", "every", "everybody", "everyone", "everything", "evidence", "exactly", "example", "executive",
  "exist", "expect", "experience", "expert", "explain", "eye", "face", "fact", "factor", "fail",
  "fall", "family", "far", "fast", "father", "fear", "federal", "feel", "feeling", "few",
  "field", "fight", "figure", "fill", "film", "final", "finally", "financial", "find", "fine",
  "finger", "finish", "fire", "firm", "first", "fish", "five", "floor", "fly", "focus",
  "follow", "food", "foot", "for", "force", "foreign", "forget", "form", "former", "forward",
  "four", "free", "friend", "from", "front", "full", "fund", "future", "game", "garden",
  "gas", "general", "generation", "get", "girl", "give", "glass", "go", "goal", "good",
  "government", "great", "green", "ground", "group", "grow", "growth", "guess", "gun", "guy",
  "hair", "half", "hand", "hang", "happen", "happy", "hard", "have", "he", "head",
  "health", "hear", "heart", "heat", "heavy", "help", "her", "here", "herself", "high",
  "him", "himself", "his", "history", "hit", "hold", "home", "hope", "hospital", "hot",
  "hotel", "hour", "house", "how", "however", "huge", "human", "hundred", "husband", "idea",
  "identify", "if", "image", "imagine", "impact", "important", "improve", "in", "include", "including",
  "increase", "indeed", "indicate", "individual", "industry", "information", "inside", "instead", "institution", "interest",
  "interesting", "international", "interview", "into", "investment", "involve", "issue", "it", "item", "its",
  "itself", "job", "join", "just", "keep", "key", "kid", "kill", "kind", "kitchen",
  "know", "knowledge", "land", "language", "large", "last", "late", "later", "laugh", "law",
  "lawyer", "lay", "lead", "leader", "learn", "least", "leave", "left", "leg", "legal",
  "less", "let", "letter", "level", "lie", "life", "light", "like", "likely", "line",
  "list", "listen", "little", "live", "local", "long", "look", "lose", "loss", "lot",
  "love", "low", "machine", "magazine", "main", "maintain", "major", "make", "man", "manage",
  "management", "manager", "many", "market", "marriage", "material", "matter", "may", "maybe", "me",
  "mean", "measure", "media", "medical", "meet", "meeting", "member", "memory", "mention", "message",
  "method", "middle", "might", "military", "million", "mind", "minute", "miss", "mission", "model",
  "modern", "moment", "money", "month", "more", "morning", "most", "mother", "mouth", "move",
  "movement", "movie", "Mr", "Mrs", "much", "music", "must", "my", "myself", "name",
  "nation", "national", "natural", "nature", "near", "nearly", "necessary", "need", "network", "never",
  "new", "news", "newspaper", "next", "nice", "night", "no", "none", "nor", "north",
  "not", "note", "nothing", "notice", "now", "number", "occur", "of", "off", "offer",
  "office", "officer", "official", "often", "oh", "oil", "ok", "old", "on", "once",
  "one", "only", "onto", "open", "operation", "opportunity", "option", "or", "order", "organization",
  "other", "others", "our", "out", "outside", "over", "own", "owner", "page", "pain",
  "painting", "paper", "parent", "part", "participant", "particular", "particularly", "partner", "party", "pass",
  "past", "patient", "pattern", "pay", "peace", "people", "per", "perform", "performance", "perhaps",
  "period", "person", "personal", "phone", "physical", "pick", "picture", "piece", "place", "plan",
  "plant", "play", "player", "PM", "point", "police", "policy", "political", "politics", "poor",
  "popular", "population", "position", "positive", "possible", "power", "practice", "prepare", "present", "president",
  "pressure", "pretty", "prevent", "price", "private", "probably", "problem", "process", "produce", "product",
  "production", "professional", "professor", "program", "project", "property", "protect", "prove", "provide", "public",
  "pull", "purpose", "push", "put", "quality", "question", "quickly", "quite", "race", "radio",
  "raise", "range", "rate", "rather", "reach", "read", "ready", "real", "reality", "realize",
  "really", "reason", "receive", "recent", "recently", "recognize", "record", "red", "reduce", "reflect",
  "region", "relate", "relationship", "religious", "remain", "remember", "remove", "report", "represent", "Republican",
  "require", "research", "resource", "respond", "response", "responsibility", "rest", "result", "return", "reveal",
  "rich", "right", "risk", "road", "rock", "role", "room", "rule", "run", "safe",
  "same", "save", "say", "scene", "school", "science", "scientist", "score", "sea", "season",
  "seat", "second", "section", "security", "see", "seek", "seem", "sell", "send", "senior",
  "sense", "series", "serious", "serve", "service", "set", "seven", "several", "sex", "sexual",
  "shake", "share", "she", "shoot", "short", "shot", "should", "shoulder", "show", "side",
  "sign", "significant", "similar", "simple", "simply", "since", "sing", "single", "sister", "sit",
  "site", "situation", "six", "size", "skill", "skin", "small", "smile", "so", "social",
  "society", "soldier", "some", "somebody", "someone", "something", "sometimes", "son", "song", "soon",
  "sort", "sound", "source", "south", "space", "speak", "special", "specific", "speech", "spend",
  "sport", "spring", "staff", "stage", "stand", "standard", "star", "start", "state", "statement",
  "station", "stay", "step", "still", "stock", "stop", "store", "story", "strategy", "street",
  "strong", "structure", "student", "study", "stuff", "style", "subject", "success", "successful", "such",
  "suddenly", "suffer", "suggest", "summer", "support", "sure", "surface", "system", "table", "take",
  "talk", "task", "tax", "teach", "teacher", "team", "technology", "television", "tell", "ten",
  "tend", "term", "test", "than", "thank", "that", "the", "their", "them", "themselves",
  "then", "theory", "there", "these", "they", "thing", "think", "third", "this", "those",
  "though", "thought", "thousand", "threat", "three", "through", "throughout", "throw", "thus", "time",
  "to", "today", "together", "tonight", "too", "top", "total", "tough", "toward", "town",
  "trade", "traditional", "training", "travel", "treat", "treatment", "tree", "trial", "trip", "trouble",
  "true", "truth", "try", "turn", "TV", "two", "type", "under", "understand", "unit",
  "until", "up", "upon", "us", "use", "usually", "value", "various", "very", "victim",
  "view", "violence", "visit", "voice", "vote", "wait", "walk", "wall", "want", "war",
  "watch", "water", "way", "we", "weapon", "wear", "week", "weight", "well", "west",
  "what", "whatever", "when", "where", "whether", "which", "while", "white", "who", "whole",
  "whom", "whose", "why", "wide", "wife", "will", "win", "wind", "window", "wish",
  "with", "within", "without", "woman", "wonder", "word", "work", "worker", "world", "worry",
  "would", "write", "writer", "wrong", "yard", "yeah", "year", "yes", "yet", "you",
  "young", "your", "yourself",
]);

// Helper function to check if a word is in the Oxford 3000
export function isInOxford3000(word: string): boolean {
  const normalized = word.toLowerCase().replace(/[^a-z]/g, "");
  return OXFORD_3000.has(normalized);
}

// Calculate percentage of words in a text that are in Oxford 3000
export function calculateOxford3000Coverage(text: string): { coverage: number; totalWords: number; knownWords: number; unknownWords: string[] } {
  const words = text.toLowerCase().match(/[a-z']+/g) || [];
  const uniqueWords = [...new Set(words)];
  let knownCount = 0;
  const unknownWords: string[] = [];
  
  for (const word of uniqueWords) {
    if (isInOxford3000(word)) {
      knownCount++;
    } else {
      unknownWords.push(word);
    }
  }
  
  return {
    coverage: uniqueWords.length > 0 ? knownCount / uniqueWords.length : 1,
    totalWords: uniqueWords.length,
    knownWords: knownCount,
    unknownWords,
  };
}

// Get vocabulary level for a text
export function getVocabularyLevel(text: string): "A1" | "A2" | "B1" | "B2" {
  const { coverage } = calculateOxford3000Coverage(text);
  if (coverage >= 0.95) return "A1";
  if (coverage >= 0.85) return "A2";
  if (coverage >= 0.75) return "B1";
  return "B2";
}
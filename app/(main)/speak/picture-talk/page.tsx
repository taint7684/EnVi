import { getDayPlan } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/server";
import { PictureTalkSession } from "@/components/picture-talk/picture-talk-session";
import type { PictureTalkImage } from "@/components/picture-talk/picture-talk-session";

const CURRICULUM_IMAGES: Record<string, PictureTalkImage[]> = {
  "topic-01-self": [
    {
      id: "pic-self-1",
      url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
      prompt: "A person waking up in a bright bedroom, stretching, sunlight through curtains",
      vocab: ["wake up", "stretch", "sunlight", "curtains", "bedroom", "morning"],
      expectedStructures: ["I usually...", "Every morning I...", "My routine is..."],
    },
    {
      id: "pic-self-2",
      url: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800&q=80",
      prompt: "Someone making coffee in a modern kitchen, pouring into a mug",
      vocab: ["make coffee", "pour", "kitchen", "mug", "morning routine", "caffeine"],
      expectedStructures: ["I always...", "First I...", "Then I..."],
    },
    {
      id: "pic-self-3",
      url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
      prompt: "Person exercising at home, yoga mat, stretching, morning workout",
      vocab: ["exercise", "yoga", "stretch", "workout", "fitness", "mat"],
      expectedStructures: ["I exercise for...", "I do...", "It takes me..."],
    },
    {
      id: "pic-self-4",
      url: "https://images.unsplash.com/photo-1556906781-9a4129ead1c9?w=800&q=80",
      prompt: "Person reading a book in bed at night, lamp on, cozy bedroom",
      vocab: ["read", "book", "bed", "night", "lamp", "cozy", "bedtime", "routine"],
      expectedStructures: ["I read...", "Before bed I...", "My night routine is..."],
    },
  ],
  "topic-02-family": [
    {
      id: "pic-family-1",
      url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&q=80",
      prompt: "Family having breakfast together, parents and kids at dining table",
      vocab: ["family", "breakfast", "together", "parents", "children", "table", "eat"],
      expectedStructures: ["We have...", "My family...", "There are... people in my family"],
    },
    {
      id: "pic-family-2",
      url: "https://images.unsplash.com/photo-1544717297-fa95b6ee9643?w=800&q=80",
      prompt: "Family walking in park on weekend, parents holding kids hands",
      vocab: ["walk", "park", "weekend", "hold hands", "outdoor", "together", "happy"],
      expectedStructures: ["On weekends we...", "We like to...", "Sometimes we..."],
    },
  ],
  "topic-03-friends": [
    {
      id: "pic-friends-1",
      url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80",
      prompt: "Friends laughing at a cafe, coffee cups on table, casual atmosphere",
      vocab: ["friends", "cafe", "laugh", "coffee", "chat", "hang out", "weekend"],
      expectedStructures: ["We meet...", "We talk about...", "My friend is..."],
    },
    {
      id: "pic-friends-2",
      url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&q=80",
      prompt: "Group of friends playing board games, sitting on floor, snacks nearby",
      vocab: ["play", "board game", "fun", "together", "snacks", "laugh", "relax"],
      expectedStructures: ["We play...", "It's fun when...", "We usually..."],
    },
  ],
  "topic-04-work-daily": [
    {
      id: "pic-work-1",
      url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80",
      prompt: "Business analyst at desk with laptop, sticky notes, coffee, dual monitors",
      vocab: ["work", "laptop", "analyst", "desk", "monitor", "notes", "busy"],
      expectedStructures: ["I work as...", "My job is...", "I usually...", "At work I..."],
    },
    {
      id: "pic-work-2",
      url: "https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&q=80",
      prompt: "Team standup meeting, people standing around whiteboard with sticky notes",
      vocab: ["meeting", "standup", "team", "whiteboard", "discuss", "agile", "sprint"],
      expectedStructures: ["We have...", "In the meeting...", "We discuss...", "The team..."],
    },
  ],
  "topic-05-hobbies": [
    {
      id: "pic-hobby-1",
      url: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80",
      prompt: "Person reading a book in a cozy chair, lamp, blanket, peaceful",
      vocab: ["read", "book", "cozy", "chair", "relax", "quiet", "hobby", "enjoy"],
      expectedStructures: ["I like to...", "In my free time...", "Reading is...", "I enjoy..."],
    },
    {
      id: "pic-hobby-2",
      url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
      prompt: "Person painting on canvas, art supplies, creative atmosphere",
      vocab: ["paint", "canvas", "art", "creative", "hobby", "colors", "brush"],
      expectedStructures: ["I paint...", "Art is...", "I started...", "It helps me..."],
    },
  ],
  "topic-06-food": [
    {
      id: "pic-food-1",
      url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80",
      prompt: "Vietnamese pho bowl with herbs, lime, chili, chopsticks, steam rising",
      vocab: ["pho", "noodles", "broth", "herbs", "lime", "chili", "delicious", "Vietnamese"],
      expectedStructures: ["My favorite food is...", "It has...", "It tastes...", "I eat it..."],
    },
    {
      id: "pic-food-2",
      url: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&q=80",
      prompt: "Person cooking in kitchen, chopping vegetables, pan on stove, ingredients",
      vocab: ["cook", "chop", "vegetables", "pan", "stove", "ingredients", "recipe", "kitchen"],
      expectedStructures: ["I cook...", "First I...", "Then I...", "The recipe says..."],
    },
  ],
  "topic-07-home": [
    {
      id: "pic-home-1",
      url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
      prompt: "Modern apartment living room, sofa, plants, large window, natural light",
      vocab: ["apartment", "living room", "sofa", "plants", "window", "light", "cozy", "home"],
      expectedStructures: ["I live in...", "My home has...", "There is...", "I like my..."],
    },
    {
      id: "pic-home-2",
      url: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&q=80",
      prompt: "Balcony with plants, chair, city view, morning coffee, peaceful",
      vocab: ["balcony", "plants", "view", "city", "coffee", "morning", "relax", "peaceful"],
      expectedStructures: ["My balcony...", "From here I can see...", "I like to...", "It's my favorite..."],
    },
  ],
  "topic-08-love": [
    {
      id: "pic-love-1",
      url: "https://images.unsplash.com/photo-1518199266791-af5d5b2c8b8e?w=800&q=80",
      prompt: "Couple walking on beach at sunset, holding hands, romantic atmosphere",
      vocab: ["couple", "beach", "sunset", "hold hands", "walk", "romantic", "love", "together"],
      expectedStructures: ["They are...", "The couple...", "It looks...", "They seem..."],
    },
  ],
  "topic-09-health": [
    {
      id: "pic-health-1",
      url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80",
      prompt: "Person jogging in park, early morning, fresh air, fitness tracker",
      vocab: ["jog", "park", "morning", "fitness", "exercise", "healthy", "run", "tracker"],
      expectedStructures: ["I exercise...", "I go...", "It helps me...", "I feel..."],
    },
  ],
  "topic-10-travel": [
    {
      id: "pic-travel-1",
      url: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80",
      prompt: "Traveler with backpack looking at map, city street, exploring, excited",
      vocab: ["travel", "backpack", "map", "city", "explore", "street", "excited", "adventure"],
      expectedStructures: ["I travel...", "I went to...", "It was...", "I want to..."],
    },
  ],
  "topic-11-money": [
    {
      id: "pic-money-1",
      url: "https://images.unsplash.com/photo-1554224155-6726b3ff402f?w=800&q=80",
      prompt: "Person budgeting at desk, calculator, notebook, laptop, coffee, focused",
      vocab: ["budget", "calculate", "money", "save", "expense", "notebook", "plan", "finance"],
      expectedStructures: ["I budget...", "I save...", "My expenses...", "I track..."],
    },
  ],
  "topic-12-tech": [
    {
      id: "pic-tech-1",
      url: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&q=80",
      prompt: "Person coding on laptop, multiple screens, code editor, coffee, dark room",
      vocab: ["code", "laptop", "screen", "programmer", "developer", "work", "late", "focus"],
      expectedStructures: ["I code...", "I use...", "It's...", "I like..."],
    },
  ],
  "topic-13-dreams": [
    {
      id: "pic-dreams-1",
      url: "https://images.unsplash.com/photo-1503602642458-232111445657?w=800&q=80",
      prompt: "Person looking at city skyline from rooftop, sunset, thoughtful, dreaming",
      vocab: ["dream", "future", "city", "skyline", "sunset", "think", "plan", "goal", "hope"],
      expectedStructures: ["I dream of...", "I want to...", "My goal is...", "In the future..."],
    },
  ],
};

function getImagesForTopic(topicId: string, layer: "L1" | "L2" | "L3"): PictureTalkImage[] {
  const baseImages = CURRICULUM_IMAGES[topicId] || CURRICULUM_IMAGES["topic-01-self"];
  return baseImages.map((img, i) => ({
    ...img,
    id: `${img.id}-${layer.toLowerCase()}`,
    prompt: layer === "L1"
      ? img.prompt
      : layer === "L2"
      ? `${img.prompt}. Tell a story about what happened before or after.`
      : `${img.prompt}. Give your opinion about this lifestyle/situation.`,
    expectedStructures: layer === "L1"
      ? img.expectedStructures
      : layer === "L2"
      ? ["First...", "Then...", "After that...", "Finally...", "It was...", "I felt..."]
      : ["In my opinion...", "I think...", "From my perspective...", "The way I see it...", "I believe..."],
  }));
}

export default async function PictureTalkPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let currentDay = 1;
  if (user) {
    const { data: progress } = await supabase
      .from("curriculum_progress")
      .select("current_day")
      .eq("user_id", user.id)
      .single();
    if (progress) currentDay = progress.current_day;
  }

  const dayPlan = getDayPlan(currentDay, {
    currentDay,
    currentWeek: Math.ceil(currentDay / 7),
    currentPhase: "G1",
    baselineLatencyMs: null,
    baselineWpm: null,
    totalSpeakingMinutes: 0,
    streakDays: 0,
  });

  const pictureBlock = dayPlan.blocks.find(b => b.id === "picture_talk");
  const topicId = pictureBlock?.config.topicId || "topic-01-self";
  const layer = pictureBlock?.config.layer || "L1";
  const round = pictureBlock?.config.round || 1;
  const imageSetId = pictureBlock?.config.imageSetId || `pic-self-${layer.toLowerCase()}`;

  const images = getImagesForTopic(topicId, layer);

  const config = {
    topicId,
    layer,
    round,
    imageSetId,
    images,
  };

  return (
    <div className="py-4">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Picture Talk - Mô tả ảnh
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ngày {currentDay}/180 · {dayPlan.topicNameVi} · Layer {layer} · Round {round} · {images.length} ảnh
        </p>
      </div>
      <PictureTalkSession config={config} />
    </div>
  );
}
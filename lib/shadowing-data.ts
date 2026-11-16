export type ShadowingLesson = {
  id: string;
  title: string;
  titleVi: string;
  type: "audio" | "video";
  url: string;
  duration: string;
  transcript: ShadowingSegment[];
};

export type ShadowingSegment = {
  id: number;
  start: number;
  end: number;
  text: string;
};

export const SHADOWING_LESSONS: ShadowingLesson[] = [
  {
    id: "voa-1",
    title: "VOA Learning English - The Health Report",
    titleVi: "VOA Learning English - Báo cáo Sức khỏe",
    type: "audio",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    duration: "06:12",
    transcript: [
      { id: 1, start: 0, end: 8, text: "Welcome to The Health Report. I'm your host, Ashley Thompson." },
      { id: 2, start: 8, end: 16, text: "Today we're going to talk about a new study on sleep and memory." },
      { id: 3, start: 16, end: 24, text: "Researchers at Stanford University found that people who sleep for at least seven hours a night perform better on memory tests." },
      { id: 4, start: 24, end: 32, text: "The study followed over five hundred participants for six months." },
      { id: 5, start: 32, end: 40, text: "Participants were divided into two groups: those who slept eight hours and those who slept six hours." },
      { id: 6, start: 40, end: 48, text: "The results showed that the eight-hour group scored twenty percent higher on average." },
      { id: 7, start: 48, end: 56, text: "Dr. Martinez, the lead researcher, says sleep is essential for consolidating memories." },
      { id: 8, start: 56, end: 64, text: "Without adequate rest, the brain cannot properly process and store new information." },
      { id: 9, start: 64, end: 72, text: "The researchers recommend that adults aim for seven to nine hours of sleep each night." },
      { id: 10, start: 72, end: 80, text: "That's all for today's Health Report. Join us next week for more updates." },
    ],
  },
  {
    id: "voa-2",
    title: "VOA Learning English - Technology Report",
    titleVi: "VOA Learning English - Báo cáo Công nghệ",
    type: "audio",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    duration: "05:45",
    transcript: [
      { id: 1, start: 0, end: 6, text: "Hello and welcome to the Technology Report from VOA Learning English." },
      { id: 2, start: 6, end: 12, text: "Artificial intelligence is changing the way we work and live." },
      { id: 3, start: 12, end: 18, text: "A new report from MIT shows that AI could replace forty percent of jobs in the next decade." },
      { id: 4, start: 18, end: 24, text: "However, the report also emphasizes that AI will create new opportunities." },
      { id: 5, start: 24, end: 30, text: "Jobs in data analysis, machine learning, and robotics are growing rapidly." },
      { id: 6, start: 30, end: 36, text: "Experts advise workers to develop skills in critical thinking and creativity." },
      { id: 7, start: 36, end: 42, text: "These human abilities are difficult for machines to replicate." },
      { id: 8, start: 42, end: 48, text: "The report concludes that continuous learning will be essential for career success." },
    ],
  },
  {
    id: "ted-1",
    title: "TED Talk - How to Learn Anything",
    titleVi: "TED Talk - Cách Học Bất Cứ Điều Gì",
    type: "video",
    url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    duration: "18:42",
    transcript: [
      { id: 1, start: 0, end: 10, text: "Thank you so much. It's a pleasure to be here today." },
      { id: 2, start: 10, end: 20, text: "I want to talk about something that changed my life completely." },
      { id: 3, start: 20, end: 30, text: "Five years ago, I decided to learn how to play the guitar." },
      { id: 4, start: 30, end: 40, text: "I had always wanted to play, but I thought I was too old to start." },
      { id: 5, start: 40, end: 50, text: "I was wrong. The truth is, anyone can learn anything at any age." },
      { id: 6, start: 50, end: 60, text: "The key is not talent, but practice and persistence." },
      { id: 7, start: 60, end: 70, text: "I practiced for thirty minutes every single day." },
      { id: 8, start: 70, end: 80, text: "After six months, I could play my first complete song." },
      { id: 9, start: 80, end: 90, text: "After one year, I joined a band and performed at local venues." },
      { id: 10, start: 90, end: 100, text: "The lesson I learned is simple: consistency beats intensity." },
    ],
  },
];

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
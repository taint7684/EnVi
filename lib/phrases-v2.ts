import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { DuePhrase, PhraseReviewRow, PhraseRow } from "@/lib/types";
import { getDayPlan } from "@/lib/curriculum";

export const SESSION_SIZE = 20;
export const DAILY_NEW_LIMIT = 10;
const NEW_PHRASES_PAGE_SIZE = 100;

const REFLEX_PHRASES: Record<string, PhraseRow[]> = {
  "topic-01-self": [
    { id: "self-1", vi_text: "Tôi thường dậy lúc 6 giờ sáng.", en_text: "I usually wake up at 6 AM.", audio_url: null, topic: "topic-01-self", difficulty: "A1", level: "L1", en_alternatives: ["I get up at 6.", "I'm up at 6."], situation_en: "Your alarm goes off. What time do you wake up?", keywords: ["wake", "6", "AM"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "self-2", vi_text: "Tôi uống cà phê mỗi sáng.", en_text: "I drink coffee every morning.", audio_url: null, topic: "topic-01-self", difficulty: "A1", level: "L1", en_alternatives: ["I have coffee daily.", "Coffee is my morning routine."], situation_en: "You're at the kitchen counter. What do you do first?", keywords: ["drink", "coffee", "morning"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "self-3", vi_text: "Tôi tập thể dục 30 phút.", en_text: "I exercise for 30 minutes.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I work out for half an hour.", "I do a 30-minute workout."], situation_en: "Describe your morning routine. What comes after coffee?", keywords: ["exercise", "30", "minutes"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "continue" },
    { id: "self-4", vi_text: "Tôi kiểm tra email ngay.", en_text: "I check emails right away.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I check my inbox immediately.", "First thing, I check emails."], situation_en: "You sit at your desk. What's the first thing you do?", keywords: ["check", "email", "right away"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "self-5", vi_text: "Tôi lên kế hoạch cho ngày.", en_text: "I plan my day.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I organize my schedule.", "I map out my tasks."], situation_en: "How do you start your workday? Say it differently.", keywords: ["plan", "day"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "paraphrase" },
    { id: "self-6", vi_text: "Tôi ăn trưa tại bàn làm việc.", en_text: "I eat lunch at my desk.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I have lunch at my desk.", "Lunch is at my workstation."], situation_en: "Where do you usually have lunch? Explain without saying 'at my desk'.", keywords: ["eat", "lunch", "desk"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "circumlocution" },
    { id: "self-7", vi_text: "Tôi nghỉ ngơi 15 phút.", en_text: "I take a 15-minute break.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I take a short break.", "I pause for 15 minutes."], situation_en: "What do you do in the afternoon when tired?", keywords: ["break", "15", "minute"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "self-8", vi_text: "Tôi kết thúc việc lúc 6 tối.", en_text: "I finish work at 6 PM.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I'm done at 6.", "Work ends at 6 PM."], situation_en: "Your colleague asks when you're free. What do you say?", keywords: ["finish", "work", "6", "PM"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "self-9", vi_text: "Tôi nấu ăn tối.", en_text: "I cook dinner.", audio_url: null, topic: "topic-01-self", difficulty: "A1", level: "L1", en_alternatives: ["I make dinner.", "I prepare the evening meal."], situation_en: "Continue: After work I get home and...", keywords: ["cook", "dinner"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "continue" },
    { id: "self-10", vi_text: "Tôi đọc sách trước khi ngủ.", en_text: "I read before bed.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I read in bed.", "Reading is my bedtime habit."], situation_en: "What's your night routine? Rephrase: 'I read before sleeping.'", keywords: ["read", "before", "bed"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "paraphrase" },
    { id: "self-11", vi_text: "Tôi ngủ lúc 11 giờ đêm.", en_text: "I go to sleep at 11 PM.", audio_url: null, topic: "topic-01-self", difficulty: "A1", level: "L1", en_alternatives: ["I sleep at 11.", "Bedtime is 11 PM."], situation_en: "Explain your bedtime without using the word 'sleep'.", keywords: ["sleep", "11", "PM"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "circumlocution" },
    { id: "self-12", vi_text: "Thói quen này giúp tôi hiệu quả.", en_text: "This habit makes me productive.", audio_url: null, topic: "topic-01-self", difficulty: "B1", level: "L2", en_alternatives: ["This routine boosts my productivity.", "It keeps me productive."], situation_en: "Why do you keep this routine? Give a reason.", keywords: ["habit", "productive"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },

    // Days 2-7: Additional 44 phrases (8 per day × 7 days = 56 total)
    // Day 2 - Morning details
    { id: "self-13", vi_text: "Báo thức réo lúc 5:30.", en_text: "My alarm goes off at 5:30.", audio_url: null, topic: "topic-01-self", difficulty: "A1", level: "L1", en_alternatives: ["The alarm rings at 5:30."], situation_en: "Someone asks what time your alarm is set for.", keywords: ["alarm", "5:30"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "self-14", vi_text: "Tôi tắt báo thức và ngồi dậy.", en_text: "I turn off the alarm and sit up.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I hit snooze and get up."], situation_en: "The alarm rings. What do you do immediately?", keywords: ["turn off", "alarm", "sit up"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "self-15", vi_text: "Tôi uống một cốc nước.", en_text: "I drink a glass of water.", audio_url: null, topic: "topic-01-self", difficulty: "A1", level: "L1", en_alternatives: ["I have some water."], situation_en: "Continue: After sitting up, I go to the kitchen and...", keywords: ["drink", "glass", "water"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "continue" },
    { id: "self-16", vi_text: "Tôi rửa mặt và chải răng.", en_text: "I wash my face and brush my teeth.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I freshen up."], situation_en: "Say it differently: 'I clean my face and brush my teeth.'", keywords: ["wash", "face", "brush", "teeth"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "paraphrase" },
    { id: "self-17", vi_text: "Tôi thay đồ vào quần áo tập.", en_text: "I change into workout clothes.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I put on my gym clothes."], situation_en: "Explain without saying 'change' or 'workout'.", keywords: ["change", "workout", "clothes"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "circumlocution" },
    { id: "self-18", vi_text: "Tôi chạy bộ 20 phút.", en_text: "I jog for 20 minutes.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I go for a 20-minute run."], situation_en: "You're dressed for exercise. What do you do?", keywords: ["jog", "20", "minutes"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "self-19", vi_text: "Tôi tắm nước nóng.", en_text: "I take a hot shower.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I have a hot shower."], situation_en: "After jogging, you're sweaty. What next?", keywords: ["shower", "hot"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "self-20", vi_text: "Tôi mặc quần áo đi làm.", en_text: "I put on my work clothes.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I get dressed for work."], situation_en: "Continue: After the shower, I...", keywords: ["put on", "work", "clothes"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "continue" },

    // Day 3 - Work start
    { id: "self-21", vi_text: "Tôi ra khỏi nhà lúc 7:30.", en_text: "I leave home at 7:30.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I head out at 7:30."], situation_en: "What time do you leave the house?", keywords: ["leave", "home", "7:30"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "self-22", vi_text: "Tôi đi xe buýt đến văn phòng.", en_text: "I take the bus to the office.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I commute by bus."], situation_en: "You're at the bus stop. How do you get to work?", keywords: ["take", "bus", "office"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "self-23", vi_text: "Tôi nghe podcast trên đường.", en_text: "I listen to a podcast on the way.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I play a podcast during my commute."], situation_en: "Continue: During the bus ride, I...", keywords: ["listen", "podcast", "way"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "continue" },
    { id: "self-24", vi_text: "Tôi đến văn phòng lúc 8:15.", en_text: "I arrive at the office at 8:15.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I get to work at 8:15."], situation_en: "Say it differently: 'I reach the office at 8:15.'", keywords: ["arrive", "office", "8:15"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "paraphrase" },
    { id: "self-25", vi_text: "Tôi bật máy tính lên.", en_text: "I turn on my computer.", audio_url: null, topic: "topic-01-self", difficulty: "A1", level: "L1", en_alternatives: ["I boot up my laptop."], situation_en: "Explain without saying 'turn on' or 'computer'.", keywords: ["turn on", "computer"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "circumlocution" },
    { id: "self-26", vi_text: "Tôi kiểm tra lịch họp hôm nay.", en_text: "I check today's meeting schedule.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I look at my calendar for today."], situation_en: "First thing at your desk. What do you check?", keywords: ["check", "meeting", "schedule"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "self-27", vi_text: "Tôi có standup lúc 9 giờ.", en_text: "I have standup at 9 AM.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["Our daily standup is at 9."], situation_en: "Your manager asks when the team meets. What do you say?", keywords: ["standup", "9", "AM"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "self-28", vi_text: "Tôi cập nhật tiến độ cho team.", en_text: "I update the team on my progress.", audio_url: null, topic: "topic-01-self", difficulty: "B1", level: "L1", en_alternatives: ["I share my progress with the team."], situation_en: "Continue: During standup, I...", keywords: ["update", "team", "progress"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "continue" },

    // Day 4 - Work flow
    { id: "self-29", vi_text: "Tôi viết codefeature mới.", en_text: "I write code for a new feature.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I'm coding a new feature."], situation_en: "What are you working on this morning?", keywords: ["write", "code", "feature"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "self-30", vi_text: "Tôi thảo luận với đồng nghiệp.", en_text: "I discuss with a colleague.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I talk it over with a coworker."], situation_en: "You're stuck on a problem. What do you do?", keywords: ["discuss", "colleague"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "self-31", vi_text: "Tôi review code của bạn.", en_text: "I review my teammate's code.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I do a code review for a teammate."], situation_en: "Continue: After coding, I...", keywords: ["review", "code", "teammate"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "continue" },
    { id: "self-32", vi_text: "Tôi sửa lỗi trong code.", en_text: "I fix a bug in the code.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I debug the code."], situation_en: "Say it differently: 'I correct an error in the program.'", keywords: ["fix", "bug", "code"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "paraphrase" },
    { id: "self-33", vi_text: "Tôi deploy lên staging.", en_text: "I deploy to staging.", audio_url: null, topic: "topic-01-self", difficulty: "B1", level: "L1", en_alternatives: ["I push the build to staging."], situation_en: "Explain without using 'deploy' or 'staging'.", keywords: ["deploy", "staging"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "circumlocution" },
    { id: "self-34", vi_text: "Tôi ăn trưa cùng team.", en_text: "I have lunch with the team.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["We eat lunch together."], situation_en: "It's noon. What do you do for lunch?", keywords: ["lunch", "team"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "self-35", vi_text: "Tôi nghỉ trưa 45 phút.", en_text: "I take a 45-minute lunch break.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["My lunch break is 45 minutes."], situation_en: "Your calendar shows 'lunch'. How long is it?", keywords: ["lunch", "break", "45", "minutes"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "self-36", vi_text: "Tôi đi dạo quanh tòa nhà.", en_text: "I walk around the building.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I take a walk around the office."], situation_en: "Continue: After eating, I...", keywords: ["walk", "around", "building"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "continue" },

    // Day 5 - Afternoon
    { id: "self-37", vi_text: "Tôi làm việc tập trung 2 tiếng.", en_text: "I do deep work for two hours.", audio_url: null, topic: "topic-01-self", difficulty: "B1", level: "L1", en_alternatives: ["I focus deeply for two hours."], situation_en: "What do you do in the afternoon?", keywords: ["deep work", "two", "hours"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "self-38", vi_text: "Tôi tắt thông báo để tập trung.", en_text: "I turn off notifications to focus.", audio_url: null, topic: "topic-01-self", difficulty: "B1", level: "L1", en_alternatives: ["I silence notifications for focus."], situation_en: "You need to concentrate. What do you do first?", keywords: ["turn off", "notifications", "focus"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "self-39", vi_text: "Tôi hoàn thành task chính.", en_text: "I finish the main task.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I complete the primary task."], situation_en: "Continue: After two hours of focus, I...", keywords: ["finish", "main", "task"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "continue" },
    { id: "self-40", vi_text: "Tôi kiểm tra email cuối ngày.", en_text: "I check emails at day's end.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I do a final email check."], situation_en: "Say it differently: 'I review my inbox before leaving.'", keywords: ["check", "email", "end", "day"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "paraphrase" },
    { id: "self-41", vi_text: "Tôi tóm tắt việc đã làm.", en_text: "I summarize what I've done.", audio_url: null, topic: "topic-01-self", difficulty: "B1", level: "L1", en_alternatives: ["I write a quick summary."], situation_en: "Explain without saying 'summarize' or 'done'.", keywords: ["summarize", "done"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "circumlocution" },
    { id: "self-42", vi_text: "Tôi tắt máy tính lúc 6.", en_text: "I shut down my computer at 6.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I power off at 6 PM."], situation_en: "The clock hits 6. What do you do?", keywords: ["shut down", "computer", "6"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "self-43", vi_text: "Tôi nói tạm biệt với đồng nghiệp.", en_text: "I say goodbye to colleagues.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I bid my coworkers farewell."], situation_en: "You're leaving the office. What do you say?", keywords: ["goodbye", "colleagues"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "self-44", vi_text: "Tôi về nhà bằng xe buýt.", en_text: "I take the bus home.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I commute home by bus."], situation_en: "Continue: After leaving, I...", keywords: ["bus", "home"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "continue" },

    // Day 6 - Evening
    { id: "self-45", vi_text: "Tôi đến nhà lúc 7 tối.", en_text: "I get home at 7 PM.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I arrive home at 7."], situation_en: "What time do you get home?", keywords: ["get", "home", "7", "PM"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "self-46", vi_text: "Tôi thay đồ thoải mái.", en_text: "I change into comfortable clothes.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I put on something comfortable."], situation_en: "You walk through the door. What's the first thing?", keywords: ["change", "comfortable", "clothes"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "self-47", vi_text: "Tôi nấu cơm chiên trứng.", en_text: "I make egg fried rice.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I cook egg fried rice."], situation_en: "Continue: In the kitchen, I...", keywords: ["make", "egg", "fried", "rice"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "continue" },
    { id: "self-48", vi_text: "Tôi ăn tối xem ti vi.", en_text: "I have dinner while watching TV.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I eat dinner and watch TV."], situation_en: "Say it differently: 'I watch a show during dinner.'", keywords: ["dinner", "watch", "TV"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "paraphrase" },
    { id: "self-49", vi_text: "Tôi rửa bát sau ăn.", en_text: "I wash the dishes after eating.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I do the dishes."], situation_en: "Explain without saying 'wash' or 'dishes'.", keywords: ["wash", "dishes", "eating"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "circumlocution" },
    { id: "self-50", vi_text: "Tôi lướt điện thoại 30 phút.", en_text: "I scroll on my phone for 30 minutes.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I browse my phone for half an hour."], situation_en: "You're on the sofa. What do you do to relax?", keywords: ["scroll", "phone", "30", "minutes"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "self-51", vi_text: "Tôi đọc sách 20 trang.", en_text: "I read 20 pages of my book.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I read twenty pages."], situation_en: "You put the phone away. What next?", keywords: ["read", "20", "pages", "book"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "self-52", vi_text: "Tôi tắt đèn ngủ lúc 11.", en_text: "I turn off the light at 11.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["Lights out at 11."], situation_en: "Continue: After reading, I...", keywords: ["turn off", "light", "11"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "continue" },

    // Day 7 - Weekend / Reflection
    { id: "self-53", vi_text: "Cuối tuần tôi dậy muộn hơn.", en_text: "On weekends I wake up later.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I sleep in on weekends."], situation_en: "How's your weekend routine different?", keywords: ["weekend", "wake up", "later"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "self-54", vi_text: "Tôi nấu brunch cho gia đình.", en_text: "I cook brunch for the family.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I make brunch for everyone."], situation_en: "It's Saturday late morning. What are you doing?", keywords: ["cook", "brunch", "family"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "self-55", vi_text: "Tôi đi cà phê với bạn.", en_text: "I go for coffee with a friend.", audio_url: null, topic: "topic-01-self", difficulty: "A2", level: "L1", en_alternatives: ["I meet a friend for coffee."], situation_en: "Continue: In the afternoon, I...", keywords: ["coffee", "friend"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "continue" },
    { id: "self-56", vi_text: "Tôi chuẩn bị cho tuần mới.", en_text: "I prepare for the new week.", audio_url: null, topic: "topic-01-self", difficulty: "B1", level: "L1", en_alternatives: ["I get ready for the week ahead."], situation_en: "Say it differently: 'I plan the upcoming week.'", keywords: ["prepare", "new", "week"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "paraphrase" },
  ],
  "topic-02-family": [
    { id: "fam-1", vi_text: "Gia đình tôi có 4 người.", en_text: "There are four people in my family.", audio_url: null, topic: "topic-02-family", difficulty: "A1", level: "L1", en_alternatives: ["My family has four members.", "We're a family of four."], situation_en: "Tell me about your family.", keywords: ["four", "people", "family"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "fam-2", vi_text: "Cha tôi là kỹ sư.", en_text: "My father is an engineer.", audio_url: null, topic: "topic-02-family", difficulty: "A1", level: "L1", en_alternatives: ["Dad works as an engineer.", "My dad's an engineer."], situation_en: "What does your father do?", keywords: ["father", "engineer"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "fam-3", vi_text: "Mẹ tôi nấu ăn rất ngon.", en_text: "My mother cooks very well.", audio_url: null, topic: "topic-02-family", difficulty: "A2", level: "L1", en_alternatives: ["Mom's cooking is amazing.", "My mom's a great cook."], situation_en: "Who cooks in your family?", keywords: ["mother", "cook", "well"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "fam-4", vi_text: "Anh trai tôi lớn hơn tôi 3 tuổi.", en_text: "My brother is 3 years older.", audio_url: null, topic: "topic-02-family", difficulty: "A2", level: "L1", en_alternatives: ["I have an older brother, 3 years apart.", "My brother's three years older."], situation_en: "Do you have siblings?", keywords: ["brother", "3", "years", "older"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "fam-5", vi_text: "Chúng tôi ăn tối cùng nhau.", en_text: "We have dinner together.", audio_url: null, topic: "topic-02-family", difficulty: "A1", level: "L1", en_alternatives: ["We eat dinner as a family.", "Family dinner is our routine."], situation_en: "What's your family routine?", keywords: ["dinner", "together"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "fam-6", vi_text: "Cuối tuần chúng tôi đi dạo.", en_text: "We go for walks on weekends.", audio_url: null, topic: "topic-02-family", difficulty: "A2", level: "L1", en_alternatives: ["Weekend walks are our thing.", "We take walks on Saturdays."], situation_en: "What do you do on weekends?", keywords: ["weekend", "walk"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "fam-7", vi_text: "Bà tôi sống cùng chúng tôi.", en_text: "Grandma lives with us.", audio_url: null, topic: "topic-02-family", difficulty: "A2", level: "L1", en_alternatives: ["My grandmother lives with us.", "We live with grandma."], situation_en: "Who lives in your house?", keywords: ["grandma", "live", "with", "us"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "fam-8", vi_text: "Chúng tôi tranh luận đôi khi.", en_text: "We argue sometimes.", audio_url: null, topic: "topic-02-family", difficulty: "A2", level: "L1", en_alternatives: ["We have arguments occasionally.", "Sometimes we disagree."], situation_en: "Do you ever fight with family?", keywords: ["argue", "sometimes"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "fam-9", vi_text: "Chúng tôi luôn hỗ trợ nhau.", en_text: "We always support each other.", audio_url: null, topic: "topic-02-family", difficulty: "B1", level: "L2", en_alternatives: ["Family support is unconditional.", "We've got each other's backs."], situation_en: "What's your family like?", keywords: ["support", "each other"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "paraphrase" },
    { id: "fam-10", vi_text: "Tết là dịp sum họp.", en_text: "Tet is for family reunion.", audio_url: null, topic: "topic-02-family", difficulty: "B1", level: "L2", en_alternatives: ["We gather for Tet.", "Tet means family time."], situation_en: "What's a special family occasion?", keywords: ["Tet", "reunion", "family"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "paraphrase" },
    { id: "fam-11", vi_text: "Con cái lớn rồi tự lập.", en_text: "Kids grow up and become independent.", audio_url: null, topic: "topic-02-family", difficulty: "B1", level: "L2", en_alternatives: ["Children eventually leave home.", "They become independent adults."], situation_en: "How do family dynamics change?", keywords: ["kids", "grow", "independent"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "continue" },
    { id: "fam-12", vi_text: "Tôi muốn có gia đình riêng.", en_text: "I want my own family someday.", audio_url: null, topic: "topic-02-family", difficulty: "B1", level: "L2", en_alternatives: ["Starting a family is my goal.", "I hope to have a family."], situation_en: "What are your future plans?", keywords: ["want", "own", "family"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "continue" },
  ],
  "topic-03-friends": [
    { id: "fr-1", vi_text: "Tôi có một người bạn thân.", en_text: "I have a close friend.", audio_url: null, topic: "topic-03-friends", difficulty: "A1", level: "L1", en_alternatives: ["I've got a best friend.", "There's a close friend."], situation_en: "Do you have close friends?", keywords: ["close", "friend"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "fr-2", vi_text: "Chúng tôi gặp nhau mỗi tuần.", en_text: "We meet every week.", audio_url: null, topic: "topic-03-friends", difficulty: "A2", level: "L1", en_alternatives: ["We hang out weekly.", "We see each other every week."], situation_en: "How often do you meet?", keywords: ["meet", "every", "week"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "fr-3", vi_text: "Chúng tôi nói chuyện hàng giờ.", en_text: "We talk for hours.", audio_url: null, topic: "topic-03-friends", difficulty: "A2", level: "L1", en_alternatives: ["We chat for hours.", "Our conversations last hours."], situation_en: "What do you do together?", keywords: ["talk", "hours"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "fr-4", vi_text: "Bạn tôi rất hài hước.", en_text: "My friend is very funny.", audio_url: null, topic: "topic-03-friends", difficulty: "A2", level: "L1", en_alternatives: ["He's hilarious.", "She cracks me up."], situation_en: "What's your friend like?", keywords: ["friend", "funny"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "fr-5", vi_text: "Chúng tôi chơi game cùng nhau.", en_text: "We play games together.", audio_url: null, topic: "topic-03-friends", difficulty: "A1", level: "L1", en_alternatives: ["We game together.", "Gaming is our thing."], situation_en: "What activities do you share?", keywords: ["play", "game", "together"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "fr-6", vi_text: "Chúng tôi chia sẻ mọi thứ.", en_text: "We share everything.", audio_url: null, topic: "topic-03-friends", difficulty: "A2", level: "L1", en_alternatives: ["We tell each other everything.", "No secrets between us."], situation_en: "How close are you?", keywords: ["share", "everything"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "paraphrase" },
    { id: "fr-7", vi_text: "Bạn tôi giúp tôi rất nhiều.", en_text: "My friend helps me a lot.", audio_url: null, topic: "topic-03-friends", difficulty: "A2", level: "L1", en_alternatives: ["He's always there for me.", "She supports me so much."], situation_en: "How does your friend help?", keywords: ["help", "a lot"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "fr-8", vi_text: "Chúng tôi cãi nhau hôm qua.", en_text: "We argued yesterday.", audio_url: null, topic: "topic-03-friends", difficulty: "A2", level: "L1", en_alternatives: ["We had a fight yesterday.", "Yesterday we disagreed."], situation_en: "Did you have a conflict?", keywords: ["argue", "yesterday"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "fr-9", vi_text: "Chúng tôi hòa tốt sau đó.", en_text: "We made up afterwards.", audio_url: null, topic: "topic-03-friends", difficulty: "A2", level: "L1", en_alternatives: ["We reconciled later.", "Things are good now."], situation_en: "Did you resolve it?", keywords: ["made up", "afterwards"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "continue" },
    { id: "fr-10", vi_text: "Tình bạn bền vững cần nỗ lực.", en_text: "Lasting friendship takes effort.", audio_url: null, topic: "topic-03-friends", difficulty: "B1", level: "L2", en_alternatives: ["Friendship needs work.", "You have to maintain it."], situation_en: "What makes friendship last?", keywords: ["lasting", "friendship", "effort"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "paraphrase" },
    { id: "fr-11", vi_text: "Bạn thân là người thấu hiểu.", en_text: "A best friend understands you.", audio_url: null, topic: "topic-03-friends", difficulty: "B1", level: "L2", en_alternatives: ["True friends just get you.", "They know you inside out."], situation_en: "What defines a best friend?", keywords: ["best friend", "understand"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "paraphrase" },
    { id: "fr-12", vi_text: "Tôi kết bạn mới tại công ty.", en_text: "I made new friends at work.", audio_url: null, topic: "topic-03-friends", difficulty: "A2", level: "L2", en_alternatives: ["I met friends through work.", "Work brought new friendships."], situation_en: "Where do you meet friends?", keywords: ["new friends", "work"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
  ],
  "topic-04-work-daily": [
    { id: "work-1", vi_text: "Tôi là nhà phân tích nghiệp vụ.", en_text: "I'm a business analyst.", audio_url: null, topic: "topic-04-work-daily", difficulty: "A2", level: "L1", en_alternatives: ["I work as a BA.", "My role is business analyst."], situation_en: "What do you do for work?", keywords: ["business analyst", "BA"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "work-2", vi_text: "Tôi làm việc với nhóm 5 người.", en_text: "I work with a team of five.", audio_url: null, topic: "topic-04-work-daily", difficulty: "A2", level: "L1", en_alternatives: ["My team has five people.", "There are five of us."], situation_en: "How big is your team?", keywords: ["team", "five"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "work-3", vi_text: "Mỗi sáng tôi có daily standup.", en_text: "I have a daily standup each morning.", audio_url: null, topic: "topic-04-work-daily", difficulty: "A2", level: "L1", en_alternatives: ["We do standup every morning.", "Daily standup at 9 AM."], situation_en: "What's your morning meeting?", keywords: ["standup", "morning", "daily"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "work-4", vi_text: "Tôi viết user stories.", en_text: "I write user stories.", audio_url: null, topic: "topic-04-work-daily", difficulty: "A2", level: "L1", en_alternatives: ["Writing stories is my main task.", "I create user stories."], situation_en: "What are your daily tasks?", keywords: ["write", "user stories"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "work-5", vi_text: "Tôi thảo luận với developers.", en_text: "I discuss with developers.", audio_url: null, topic: "topic-04-work-daily", difficulty: "A2", level: "L1", en_alternatives: ["I talk to devs daily.", "We sync with developers."], situation_en: "Who do you work with?", keywords: ["discuss", "developers"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "work-6", vi_text: "Tôi review pull requests.", en_text: "I review pull requests.", audio_url: null, topic: "topic-04-work-daily", difficulty: "A2", level: "L1", en_alternatives: ["PR review is part of my job.", "I check code changes."], situation_en: "Do you do code reviews?", keywords: ["review", "pull requests"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "situation" },
    { id: "work-7", vi_text: "Tôi báo cáo tiến độ cho PM.", en_text: "I report progress to the PM.", audio_url: null, topic: "topic-04-work-daily", difficulty: "B1", level: "L1", en_alternatives: ["I update the PM on progress.", "Status report to the project manager."], situation_en: "Who do you report to?", keywords: ["report", "progress", "PM"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "work-8", vi_text: "Đôi khi tôi làm thêm giờ.", en_text: "Sometimes I work overtime.", audio_url: null, topic: "topic-04-work-daily", difficulty: "A2", level: "L1", en_alternatives: ["I stay late occasionally.", "Overtime happens sometimes."], situation_en: "Do you work late?", keywords: ["overtime", "sometimes"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "work-9", vi_text: "Tôi nghỉ trưa 1 giờ.", en_text: "I take a 1-hour lunch break.", audio_url: null, topic: "topic-04-work-daily", difficulty: "A2", level: "L1", en_alternatives: ["Lunch break is an hour.", "I have an hour for lunch."], situation_en: "How long is your lunch break?", keywords: ["lunch", "break", "hour"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
    { id: "work-10", vi_text: "Dự án này khá thách thức.", en_text: "This project is quite challenging.", audio_url: null, topic: "topic-04-work-daily", difficulty: "B1", level: "L2", en_alternatives: ["It's a tough project.", "This project pushes me."], situation_en: "How's the project going?", keywords: ["project", "challenging"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "paraphrase" },
    { id: "work-11", vi_text: "Tôi học được nhiều kỹ năng mới.", en_text: "I've learned many new skills.", audio_url: null, topic: "topic-04-work-daily", difficulty: "B1", level: "L2", en_alternatives: ["I'm picking up new skills.", "This role teaches me a lot."], situation_en: "What have you learned?", keywords: ["learn", "new", "skills"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "paraphrase" },
    { id: "work-12", vi_text: "Tôi thích văn hóa công ty này.", en_text: "I like this company culture.", audio_url: null, topic: "topic-04-work-daily", difficulty: "B1", level: "L2", en_alternatives: ["The culture here is great.", "Company culture fits me."], situation_en: "What's the culture like?", keywords: ["like", "company", "culture"], reflex_reviewed: false, created_at: new Date().toISOString(), sentence_type: "qa" },
  ],
};

export async function getCurriculumPhrases(
  topicId: string,
  layer: "L1" | "L2" | "L3",
  round: 1 | 2,
  phraseCount: number = 12
): Promise<PhraseRow[]> {
  const phrases = REFLEX_PHRASES[topicId]! || REFLEX_PHRASES["topic-01-self"]!;
  const filtered = phrases.filter(p => p.level === layer);
  return filtered.slice(0, phraseCount).length > 0
    ? filtered.slice(0, phraseCount)
    : phrases.slice(0, phraseCount);
}

export async function getDuePhrases(
  limit = SESSION_SIZE,
  difficulty?: string,
): Promise<DuePhrase[]> {
  const supabase = await createClient();
  const now = new Date();

  const { data: reviews, error: reviewsError } = await supabase
    .from("phrase_reviews")
    .select(
      "id, user_id, phrase_id, ease, interval, due_at, reps, lapses, last_reviewed_at, created_at, updated_at",
    )
    .order("due_at", { ascending: true });

  if (reviewsError) throw new Error(reviewsError.message);

  const allReviews = (reviews ?? []) as PhraseReviewRow[];
  const dueReviews = allReviews.filter(
    (review) => new Date(review.due_at).getTime() <= now.getTime(),
  );
  const reviewedIds = new Set(allReviews.map((review) => review.phrase_id));

  let duePhrases: PhraseRow[] = [];
  if (dueReviews.length > 0) {
    const { data, error: phrasesError } = await supabase
      .from("phrases")
      .select("*")
      .in(
        "id",
        dueReviews.map((review) => review.phrase_id),
      );

    if (phrasesError) throw new Error(phrasesError.message);
    duePhrases = (data ?? []) as PhraseRow[];
  }

  const matchesDifficulty = (phrase: PhraseRow) =>
    !difficulty || phrase.difficulty === difficulty;

  duePhrases = duePhrases.filter(matchesDifficulty);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const newIntroducedToday = allReviews.filter(
    (review) =>
      new Date(review.created_at).getTime() >= startOfToday.getTime(),
  ).length;

  const newLimit = Math.max(
    0,
    Math.min(limit - duePhrases.length, DAILY_NEW_LIMIT - newIntroducedToday),
  );

  const newPhrases: PhraseRow[] = [];
  if (newLimit > 0) {
    let offset = 0;

    while (newPhrases.length < newLimit) {
      const { data, error: phrasesError } = await supabase
        .from("phrases")
        .select("*")
        .order("created_at", { ascending: true })
        .range(offset, offset + NEW_PHRASES_PAGE_SIZE - 1);

      if (phrasesError) throw new Error(phrasesError.message);

      const page = (data ?? []) as PhraseRow[];
      if (page.length === 0) break;

      for (const phrase of page) {
        if (!reviewedIds.has(phrase.id) && matchesDifficulty(phrase)) {
          newPhrases.push(phrase);
          if (newPhrases.length >= newLimit) break;
        }
      }

      offset += page.length;
    }
  }

  const cards: DuePhrase[] = [];
  const phraseById = new Map(duePhrases.map((phrase) => [phrase.id, phrase]));
  const reviewByPhrase = new Map(
    dueReviews.map((review) => [review.phrase_id, review]),
  );

  for (const review of dueReviews) {
    const phrase = phraseById.get(review.phrase_id);
    if (phrase) cards.push({ phrase, review });
  }

  for (const phrase of newPhrases) {
    cards.push({ phrase, review: reviewByPhrase.get(phrase.id) ?? null });
  }

  return cards.slice(0, limit);
}

export async function getDuePhraseCount(): Promise<{
  due: number;
  new: number;
  total: number;
}> {
  const supabase = await createClient();
  const now = new Date();

  const { data: reviews, error: reviewsError } = await supabase
    .from("phrase_reviews")
    .select("phrase_id, due_at, created_at");

  if (reviewsError) throw new Error(reviewsError.message);

  const allReviews = (reviews ?? []) as Pick<
    PhraseReviewRow,
    "phrase_id" | "due_at" | "created_at"
  >[];

  const due = allReviews.filter(
    (review) => new Date(review.due_at).getTime() <= now.getTime(),
  ).length;
  const reviewedIds = new Set(allReviews.map((review) => review.phrase_id));

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const newIntroducedToday = allReviews.filter(
    (review) =>
      new Date(review.created_at).getTime() >= startOfToday.getTime(),
  ).length;

  const { count: totalPhrases, error: countError } = await supabase
    .from("phrases")
    .select("*", { count: "exact", head: true });

  if (countError) throw new Error(countError.message);

  const newAvailable = Math.max(0, (totalPhrases ?? 0) - reviewedIds.size);
  const newCount = Math.min(
    newAvailable,
    Math.max(0, DAILY_NEW_LIMIT - newIntroducedToday),
  );

  return { due, new: newCount, total: due + newCount };
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j]!;
    arr[j] = temp!;
  }
  return arr;
}

export async function getReviewPhrases(
  limit = SESSION_SIZE,
  difficulty?: string,
): Promise<DuePhrase[]> {
  const supabase = await createClient();

  const { data: reviews, error: reviewsError } = await supabase
    .from("phrase_reviews")
    .select("phrase_id")
    .order("last_reviewed_at", { ascending: false });

  if (reviewsError) throw new Error(reviewsError.message);

  const ids = (reviews ?? []).map(
    (r) => (r as { phrase_id: string }).phrase_id,
  );
  if (ids.length === 0) return [];

  const { data, error: phrasesError } = await supabase
    .from("phrases")
    .select("*")
    .in("id", ids);

  if (phrasesError) throw new Error(phrasesError.message);

  let phrases = (data ?? []) as PhraseRow[];
  if (difficulty) {
    phrases = phrases.filter((phrase) => phrase.difficulty === difficulty);
  }
  if (phrases.length === 0) return [];

  return shuffleArray(phrases)
    .slice(0, limit)
    .map((phrase) => ({ phrase, review: null }));
}
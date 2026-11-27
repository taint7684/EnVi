// 180-day Chunks generation (5 phrases/day = 900 chunks)
// Generates chunk data for all 180 days across 26 topics
// Run with: npx tsx scripts/generate-chunks.ts

import { loadEnv, requireEnv } from "./lib/env";
loadEnv();

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
const groqApiKey = requireEnv("GROQ_API_KEY");

const supabase = createClient(supabaseUrl, supabaseKey);

// Chunk definitions from curriculum
const CHUNK_DEFINITIONS: Record<string, {
  vi: string;
  en: string;
  category: string;
  difficulty: "A2" | "B1" | "B2";
  exampleContext: string;
}> = {
  // L1 Base Chunks
  "daily_routine": { vi: "thói quen hàng ngày", en: "daily routine", category: "routine", difficulty: "A2", exampleContext: "My daily routine starts at 6 AM." },
  "wake_up": { vi: "thức dậy", en: "wake up", category: "routine", difficulty: "A2", exampleContext: "I usually wake up at 6:30." },
  "work_habits": { vi: "thói quen làm việc", en: "work habits", category: "work", difficulty: "A2", exampleContext: "Good work habits make you productive." },
  "free_time": { vi: "thời gian rảnh", en: "free time", category: "hobby", difficulty: "A2", exampleContext: "In my free time, I like to read." },
  "hobby_list": { vi: "danh sách sở thích", en: "list of hobbies", category: "hobby", difficulty: "A2", exampleContext: "My hobbies include reading and gaming." },
  "relax_way": { vi: "cách thư giãn", en: "way to relax", category: "hobby", difficulty: "A2", exampleContext: "Music is my favorite way to relax." },
  "favorite_food": { vi: "món ăn yêu thích", en: "favorite food", category: "food", difficulty: "A2", exampleContext: "My favorite food is pho." },
  "cook_skill": { vi: "kỹ năng nấu ăn", en: "cooking skill", category: "food", difficulty: "A2", exampleContext: "I want to improve my cooking skills." },
  "eat_out": { vi: "ăn ngoài", en: "eat out", category: "food", difficulty: "A2", exampleContext: "We eat out on weekends." },
  "home_type": { vi: "loại nhà", en: "type of home", category: "home", difficulty: "A2", exampleContext: "I live in an apartment." },
  "room_favorite": { vi: "phòng yêu thích", en: "favorite room", category: "home", difficulty: "A2", exampleContext: "My favorite room is the bedroom." },
  "neighborhood": { vi: "khu phố", en: "neighborhood", category: "home", difficulty: "A2", exampleContext: "My neighborhood is quiet and safe." },

  // L2 Story Chunks
  "past_routine": { vi: "thói quen trong quá khứ", en: "past routine", category: "routine", difficulty: "B1", exampleContext: "My past routine was very different." },
  "changed_habit": { vi: "thay đổi thói quen", en: "changed habit", category: "routine", difficulty: "B1", exampleContext: "I changed my habit of waking up late." },
  "future_plan": { vi: "kế hoạch tương lai", en: "future plan", category: "plan", difficulty: "B1", exampleContext: "My future plan is to learn Spanish." },
  "childhood_memory": { vi: "ký ức tuổi thơ", en: "childhood memory", category: "family", difficulty: "B1", exampleContext: "A fond childhood memory is playing outside." },
  "family_change": { vi: "thay đổi gia đình", en: "family change", category: "family", difficulty: "B1", exampleContext: "A big family change happened last year." },
  "family_tradition": { vi: "truyền thống gia đình", en: "family tradition", category: "family", difficulty: "B1", exampleContext: "Our family tradition is Sunday dinner." },
  "project_story": { vi: "câu chuyện dự án", en: "project story", category: "work", difficulty: "B1", exampleContext: "Let me tell you a project story." },
  "work_challenge": { vi: "thử thách công việc", en: "work challenge", category: "work", difficulty: "B1", exampleContext: "The biggest work challenge was the deadline." },
  "lesson_learned": { vi: "bài học rút ra", en: "lesson learned", category: "work", difficulty: "B1", exampleContext: "The lesson learned was to communicate early." },
  "memorable_meal": { vi: "bữa ăn đáng nhớ", en: "memorable meal", category: "food", difficulty: "B1", exampleContext: "That was a memorable meal in Hanoi." },
  "cooking_fail": { vi: "thất bại nấu ăn", en: "cooking fail", category: "food", difficulty: "B1", exampleContext: "My cooking fail was burning the rice." },
  "food_adventure": { vi: "phiêu lưu ẩm thực", en: "food adventure", category: "food", difficulty: "B1", exampleContext: "We had a food adventure in Thailand." },

  // L3 Opinion Chunks
  "balance_opinion": { vi: "quan điểm cân bằng", en: "balance opinion", category: "opinion", difficulty: "B2", exampleContext: "In my view, work-life balance is essential." },
  "routine_philosophy": { vi: "triết lý thói quen", en: "routine philosophy", category: "opinion", difficulty: "B2", exampleContext: "My routine philosophy is consistency over intensity." },
  "modern_family": { vi: "gia đình hiện đại", en: "modern family", category: "opinion", difficulty: "B2", exampleContext: "The modern family faces new challenges." },
  "elderly_care": { vi: "chăm sóc người già", en: "elderly care", category: "opinion", difficulty: "B2", exampleContext: "Elderly care should be a shared responsibility." },
  "productivity_view": { vi: "quan điểm năng suất", en: "productivity view", category: "opinion", difficulty: "B2", exampleContext: "My productivity view: deep work beats busy work." },
  "meeting_culture": { vi: "văn hóa họp", en: "meeting culture", category: "opinion", difficulty: "B2", exampleContext: "Meeting culture needs to change." },
  "healthy_eating": { vi: "ăn uống lành mạnh", en: "healthy eating", category: "opinion", difficulty: "B2", exampleContext: "Healthy eating is a lifestyle, not a diet." },
  "food_ethics": { vi: "đạo đức ẩm thực", en: "food ethics", category: "opinion", difficulty: "B2", exampleContext: "Food ethics matter more than taste." },
  "urban_vs_rural": { vi: "đô thị vs nông thôn", en: "urban vs rural", category: "opinion", difficulty: "B2", exampleContext: "Urban vs rural living has trade-offs." },
  "remote_work_future": { vi: "tương lai làm việc từ xa", en: "remote work future", category: "opinion", difficulty: "B2", exampleContext: "The future of remote work is hybrid." },

  // Work chunks L1
  "ba_daily_flow": { vi: "luồng công việc BA hàng ngày", en: "BA daily flow", category: "work", difficulty: "B1", exampleContext: "My BA daily flow starts with standup." },
  "deep_work_block": { vi: "khung giờ tập trung sâu", en: "deep work block", category: "work", difficulty: "B1", exampleContext: "I reserve mornings for deep work blocks." },
  "standup_routine": { vi: "thói quen daily standup", en: "standup routine", category: "work", difficulty: "B1", exampleContext: "Our standup routine is 15 minutes max." },
  "sprint_planning": { vi: "lên kế hoạch sprint", en: "sprint planning", category: "work", difficulty: "B1", exampleContext: "Sprint planning takes two hours." },
  "retro_format": { vi: "định dạng retrospective", en: "retro format", category: "work", difficulty: "B1", exampleContext: "We use start-stop-continue retro format." },
  "estimation_poker": { vi: "poker ước lượng", en: "estimation poker", category: "work", difficulty: "B1", exampleContext: "We play estimation poker for story points." },

  // Work chunks L2
  "tough_project": { vi: "dự án khó khăn", en: "tough project", category: "work", difficulty: "B2", exampleContext: "That was a tough project with tight deadlines." },
  "stakeholder_conflict": { vi: "xung đột các bên liên quan", en: "stakeholder conflict", category: "work", difficulty: "B2", exampleContext: "We resolved a stakeholder conflict through mediation." },
  "technical_decision": { vi: "quyết định kỹ thuật", en: "technical decision", category: "work", difficulty: "B2", exampleContext: "The technical decision was to use PostgreSQL." },
  "vague_requirement": { vi: "yêu cầu mơ hồ", en: "vague requirement", category: "work", difficulty: "B2", exampleContext: "Vague requirements caused scope creep." },
  "scope_creep": { vi: "mở rộng phạm vi", en: "scope creep", category: "work", difficulty: "B2", exampleContext: "Scope creep delayed the launch by two weeks." },
  "priority_conflict": { vi: "xung đột ưu tiên", en: "priority conflict", category: "work", difficulty: "B2", exampleContext: "Priority conflict between teams slowed us down." },

  // Work chunks L3
  "meeting_load": { vi: "gánh nặng họp", en: "meeting load", category: "opinion", difficulty: "B2", exampleContext: "Meeting load is killing productivity." },
  "focus_time_defense": { vi: "bảo vệ thời gian tập trung", en: "focus time defense", category: "opinion", difficulty: "B2", exampleContext: "We need focus time defense policies." },
  "async_first": { vi: "ưu tiên bất đồng bộ", en: "async first", category: "opinion", difficulty: "B2", exampleContext: "Async first culture reduces meetings." },
  "standup_necessity": { vi: "sự cần thiết của standup", en: "standup necessity", category: "opinion", difficulty: "B2", exampleContext: "Standup necessity depends on team size." },
  "retro_actionable": { vi: "retro có hành động", en: "retro actionable", category: "opinion", difficulty: "B2", exampleContext: "Retros must be actionable, not just talk." },
  "estimation_accuracy": { vi: "độ chính xác ước lượng", en: "estimation accuracy", category: "opinion", difficulty: "B2", exampleContext: "Estimation accuracy improves with historical data." },

  // Additional L2 story chunks for other topics
  "moving_story": { vi: "câu chuyện chuyển nhà", en: "moving story", category: "home", difficulty: "B1", exampleContext: "My moving story was chaotic but fun." },
  "renovation": { vi: "sửa chữa nhà", en: "renovation", category: "home", difficulty: "B1", exampleContext: "The renovation took three months." },
  "neighbor_story": { vi: "câu chuyện hàng xóm", en: "neighbor story", category: "home", difficulty: "B1", exampleContext: "A funny neighbor story happened last week." },
  "first_date": { vi: "cuộc hẹn đầu tiên", en: "first date", category: "love", difficulty: "B1", exampleContext: "My first date was at a coffee shop." },
  "relationship_lesson": { vi: "bài học tình yêu", en: "relationship lesson", category: "love", difficulty: "B1", exampleContext: "The relationship lesson was about communication." },
  "make_up": { vi: "hòa hợp sau cãi vã", en: "make up", category: "love", difficulty: "B1", exampleContext: "We made up after talking it through." },
  "health_scare": { vi: "sợ bệnh", en: "health scare", category: "health", difficulty: "B1", exampleContext: "A health scare made me change my lifestyle." },
  "recovery": { vi: "hồi phục", en: "recovery", category: "health", difficulty: "B1", exampleContext: "My recovery took six weeks." },
  "lifestyle_change": { vi: "thay đổi lối sống", en: "lifestyle change", category: "health", difficulty: "B1", exampleContext: "A lifestyle change improved my energy." },
  "travel_mishap": { vi: "sự cố du lịch", en: "travel mishap", category: "travel", difficulty: "B1", exampleContext: "A travel mishap taught me to pack light." },
  "best_trip": { vi: "chuyến đi tốt nhất", en: "best trip", category: "travel", difficulty: "B1", exampleContext: "My best trip was to Japan." },
  "culture_shock": { vi: "sốc văn hóa", en: "culture shock", category: "travel", difficulty: "B1", exampleContext: "Culture shock hit me in the first week." },
  "big_purchase": { vi: "mua sắm lớn", en: "big purchase", category: "money", difficulty: "B1", exampleContext: "My big purchase was a laptop." },
  "investment_story": { vi: "câu chuyện đầu tư", en: "investment story", category: "money", difficulty: "B1", exampleContext: "My investment story started with index funds." },
  "saving_goal": { vi: "mục tiêu tiết kiệm", en: "saving goal", category: "money", difficulty: "B1", exampleContext: "My saving goal is an emergency fund." },
  "debug_story": { vi: "câu chuyện debug", en: "debug story", category: "tech", difficulty: "B1", exampleContext: "A debug story that took all night." },
  "tech_project": { vi: "dự án công nghệ", en: "tech project", category: "tech", difficulty: "B1", exampleContext: "My tech project uses React and Node." },
  "tool_switch": { vi: "chuyển đổi công cụ", en: "tool switch", category: "tech", difficulty: "B1", exampleContext: "The tool switch improved our workflow." },
  "pursuit_story": { vi: "câu chuyện theo đuổi", en: "pursuit story", category: "dreams", difficulty: "B1", exampleContext: "My pursuit story began with a single step." },
  "pivot_moment": { vi: "khoảnh khắc quay chiều", en: "pivot moment", category: "dreams", difficulty: "B1", exampleContext: "The pivot moment changed my career path." },
  "regret_lesson": { vi: "bài học hối tiếc", en: "regret lesson", category: "dreams", difficulty: "B1", exampleContext: "A regret lesson taught me to act sooner." },

  // Additional L3 opinion chunks
  "friendship_quality": { vi: "chất lượng tình bạn", en: "friendship quality", category: "opinion", difficulty: "B2", exampleContext: "Friendship quality matters more than quantity." },
  "online_vs_offline": { vi: "trực tuyến vs ngoại tuyến", en: "online vs offline", category: "opinion", difficulty: "B2", exampleContext: "Online vs offline friendships are different." },
  "hobby_career": { vi: "sở thích thành nghề", en: "hobby career", category: "opinion", difficulty: "B2", exampleContext: "Turning a hobby into a career is risky." },
  "passion_vs_job": { vi: "đam mê vs công việc", en: "passion vs job", category: "opinion", difficulty: "B2", exampleContext: "Passion vs job: find the overlap." },
  "sustainable_travel": { vi: "du lịch bền vững", en: "sustainable travel", category: "opinion", difficulty: "B2", exampleContext: "Sustainable travel protects destinations." },
  "overtourism": { vi: "du lịch quá tải", en: "overtourism", category: "opinion", difficulty: "B2", exampleContext: "Overtourism ruins local life." },
  "money_happiness": { vi: "tiền và hạnh phúc", en: "money happiness", category: "opinion", difficulty: "B2", exampleContext: "Money happiness has diminishing returns." },
  "minimalism": { vi: "tối giản", en: "minimalism", category: "opinion", difficulty: "B2", exampleContext: "Minimalism reduces decision fatigue." },
  "ai_impact": { vi: "tác động AI", en: "AI impact", category: "opinion", difficulty: "B2", exampleContext: "AI impact on jobs is double-edged." },
  "tech_ethics": { vi: "đạo đức công nghệ", en: "tech ethics", category: "opinion", difficulty: "B2", exampleContext: "Tech ethics must keep pace with innovation." },
  "if_i_had": { vi: "nếu tôi có", en: "if I had", category: "opinion", difficulty: "B2", exampleContext: "If I had known, I would have started earlier." },

  // Round 2 L2 story chunks
  "parenthood_career": { vi: "cha mẹ và sự nghiệp", en: "parenthood career", category: "work", difficulty: "B2", exampleContext: "Balancing parenthood and career is hard." },
  "elderly_care_leave": { vi: "nghỉ chăm sóc người già", en: "elderly care leave", category: "work", difficulty: "B2", exampleContext: "I took elderly care leave last month." },
  "partner_job_change": { vi: "đối tác thay đổi công việc", en: "partner job change", category: "work", difficulty: "B2", exampleContext: "My partner's job change affected our plans." },
  "mentor_story": { vi: "câu chuyện mentor", en: "mentor story", category: "work", difficulty: "B2", exampleContext: "A mentor story that shaped my career." },
  "referral_success": { vi: "thành công giới thiệu", en: "referral success", category: "work", difficulty: "B2", exampleContext: "A referral success got me the interview." },
  "networking_fail": { vi: "thất bại kết nối", en: "networking fail", category: "work", difficulty: "B2", exampleContext: "A networking fail taught me authenticity." },
  "mvp_story": { vi: "câu chuyện MVP", en: "MVP story", category: "work", difficulty: "B2", exampleContext: "Our MVP story started with a prototype." },
  "user_feedback": { vi: "phản hồi người dùng", en: "user feedback", category: "work", difficulty: "B2", exampleContext: "User feedback changed our roadmap." },
  "pivot_decision": { vi: "quyết định quay chiều", en: "pivot decision", category: "work", difficulty: "B2", exampleContext: "The pivot decision saved the startup." },
  "cultural_etiquette": { vi: "nghi thức văn hóa", en: "cultural etiquette", category: "work", difficulty: "B2", exampleContext: "Cultural etiquette matters in business dining." },
  "allergy_incident": { vi: "sự cố dị ứng", en: "allergy incident", category: "work", difficulty: "B2", exampleContext: "An allergy incident at team lunch." },
  "negotiate_menu": { vi: "thương lượng thực đơn", en: "negotiate menu", category: "work", difficulty: "B2", exampleContext: "We had to negotiate the menu for allergies." },
  "isolation_story": { vi: "câu chuyện cô lập", en: "isolation story", category: "work", difficulty: "B2", exampleContext: "An isolation story from remote work." },
  "collaboration_tool": { vi: "công cụ cộng tác", en: "collaboration tool", category: "work", difficulty: "B2", exampleContext: "The right collaboration tool makes a difference." },
  "async_win": { vi: "thắng thế bất đồng bộ", en: "async win", category: "work", difficulty: "B2", exampleContext: "An async win saved us a meeting." },
  "relocation_decision": { vi: "quyết định chuyển nơi", en: "relocation decision", category: "work", difficulty: "B2", exampleContext: "The relocation decision was mutual." },
  "career_break": { vi: "nghỉ sự nghiệp", en: "career break", category: "work", difficulty: "B2", exampleContext: "A career break for family reasons." },
  "financial_merge": { vi: "hợp nhất tài chính", en: "financial merge", category: "work", difficulty: "B2", exampleContext: "Financial merge after marriage." },
  "breakdown_signs": { vi: "dấu hiệu kiệt sức", en: "breakdown signs", category: "health", difficulty: "B2", exampleContext: "Recognizing breakdown signs early helps." },
  "recovery_steps": { vi: "bước hồi phục", en: "recovery steps", category: "health", difficulty: "B2", exampleContext: "My recovery steps included therapy." },
  "new_routine": { vi: "thói quen mới", en: "new routine", category: "health", difficulty: "B2", exampleContext: "A new routine restored my energy." },
  "conference_networking": { vi: "kết nối hội nghị", en: "conference networking", category: "work", difficulty: "B2", exampleContext: "Conference networking led to a partnership." },
  "offsite_activity": { vi: "hoạt động offsite", en: "offsite activity", category: "work", difficulty: "B2", exampleContext: "The offsite activity built team trust." },
  "speaker_experience": { vi: "trải nghiệm diễn giả", en: "speaker experience", category: "work", difficulty: "B2", exampleContext: "My speaker experience was nerve-wracking." },
  "first_investment": { vi: "đầu tư đầu tiên", en: "first investment", category: "money", difficulty: "B2", exampleContext: "My first investment was an ETF." },
  "salary_negotiation_story": { vi: "câu chuyện thương lượng lương", en: "salary negotiation story", category: "work", difficulty: "B2", exampleContext: "A salary negotiation story with a happy ending." },
  "equity_decision": { vi: "quyết định cổ phần", en: "equity decision", category: "work", difficulty: "B2", exampleContext: "The equity decision required legal advice." },
  "incident_response": { vi: "phản ứng sự cố", en: "incident response", category: "work", difficulty: "B2", exampleContext: "Incident response process kicked in." },
  "migration_story": { vi: "câu chuyện di chuyển", en: "migration story", category: "work", difficulty: "B2", exampleContext: "A migration story to the cloud." },
  "scaling_challenge": { vi: "thử thách mở rộng", en: "scaling challenge", category: "work", difficulty: "B2", exampleContext: "The scaling challenge required sharding." },
  "career_pivot": { vi: "quay chiều sự nghiệp", en: "career pivot", category: "work", difficulty: "B2", exampleContext: "My career pivot from BA to PM." },
  "promotion_journey": { vi: "hành trình thăng tiến", en: "promotion journey", category: "work", difficulty: "B2", exampleContext: "The promotion journey took three years." },
  "founder_story": { vi: "câu chuyện người sáng lập", en: "founder story", category: "work", difficulty: "B2", exampleContext: "A founder story of resilience." },

  // Round 2 L3 opinion chunks
  "flexible_hours": { vi: "giờ làm linh hoạt", en: "flexible hours", category: "opinion", difficulty: "B2", exampleContext: "Flexible hours boost productivity." },
  "office_mandate": { vi: "bắt buộc về văn phòng", en: "office mandate", category: "opinion", difficulty: "B2", exampleContext: "Office mandate hurts retention." },
  "productivity_metrics": { vi: "chỉ số năng suất", en: "productivity metrics", category: "opinion", difficulty: "B2", exampleContext: "Productivity metrics should measure outcomes." },
  "transactional_vs_genuine": { vi: "giao dịch vs chân thành", en: "transactional vs genuine", category: "opinion", difficulty: "B2", exampleContext: "Transactional vs genuine networking." },
  "cold_outreach": { vi: "liên lạc lạnh", en: "cold outreach", category: "opinion", difficulty: "B2", exampleContext: "Cold outreach works with personalization." },
  "referral_obligation": { vi: "nghĩa vụ giới thiệu", en: "referral obligation", category: "opinion", difficulty: "B2", exampleContext: "Referral obligation creates pressure." },
  "ip_ownership": { vi: "sở hữu trí tuệ", en: "IP ownership", category: "opinion", difficulty: "B2", exampleContext: "IP ownership clauses need clarity." },
  "learning_budget": { vi: "ngân sách học tập", en: "learning budget", category: "opinion", difficulty: "B2", exampleContext: "Learning budget is an investment." },
  "20_percent_time": { vi: "20% thời gian tự do", en: "20 percent time", category: "opinion", difficulty: "B2", exampleContext: "20 percent time drives innovation." },
  "catered_lunch": { vi: "trưa được cấp", en: "catered lunch", category: "opinion", difficulty: "B2", exampleContext: "Catered lunch builds culture." },
  "dietary_inclusion": { vi: "bao gồm chế độ ăn", en: "dietary inclusion", category: "opinion", difficulty: "B2", exampleContext: "Dietary inclusion shows respect." },
  "alcohol_policy": { vi: "chính sách rượu bia", en: "alcohol policy", category: "opinion", difficulty: "B2", exampleContext: "Alcohol policy varies by company." },
  "collocation_value": { vi: "giá trị làm việc cùng chỗ", en: "collocation value", category: "opinion", difficulty: "B2", exampleContext: "Collocation value for complex projects." },
  "async_by_default": { vi: "mặc định bất đồng bộ", en: "async by default", category: "opinion", difficulty: "B2", exampleContext: "Async by default reduces interruptions." },
  "hub_model": { vi: "mô hình hub", en: "hub model", category: "opinion", difficulty: "B2", exampleContext: "Hub model balances office and remote." },
  "turn_taking": { vi: "luân phiên", en: "turn taking", category: "opinion", difficulty: "B2", exampleContext: "Turn taking in career moves." },
  "relocation_fairness": { vi: "công bằng chuyển nơi", en: "relocation fairness", category: "opinion", difficulty: "B2", exampleContext: "Relocation fairness for dual-career couples." },
  "childcare_split": { vi: "chia sẻ nuôi con", en: "childcare split", category: "opinion", difficulty: "B2", exampleContext: "Childcare split should be equal." },
  "psychological_safety": { vi: "an toàn tâm lý", en: "psychological safety", category: "opinion", difficulty: "B2", exampleContext: "Psychological safety enables innovation." },
  "burnout_responsibility": { vi: "trách nhiệm kiệt sức", en: "burnout responsibility", category: "opinion", difficulty: "B2", exampleContext: "Burnout responsibility is shared." },
  "therapy_benefit": { vi: "lợi ích trị liệu", en: "therapy benefit", category: "opinion", difficulty: "B2", exampleContext: "Therapy benefit extends to work." },
  "conference_value": { vi: "giá trị hội nghị", en: "conference value", category: "opinion", difficulty: "B2", exampleContext: "Conference value: connections over content." },
  "offsite_frequency": { vi: "tần suất offsite", en: "offsite frequency", category: "opinion", difficulty: "B2", exampleContext: "Quarterly offsite frequency works well." },
  "virtual_alternative": { vi: "lựa chọn ảo", en: "virtual alternative", category: "opinion", difficulty: "B2", exampleContext: "Virtual alternative for inclusive offsites." },
  "salary_bands": { vi: "thang lương", en: "salary bands", category: "opinion", difficulty: "B2", exampleContext: "Salary bands increase transparency." },
  "equity_refresh": { vi: "làm mới cổ phần", en: "equity refresh", category: "opinion", difficulty: "B2", exampleContext: "Equity refresh retains top talent." },
  "performance_pay": { vi: "trả lương theo kết quả", en: "performance pay", category: "opinion", difficulty: "B2", exampleContext: "Performance pay aligns incentives." },
  "build_vs_buy": { vi: "tự xây vs mua", en: "build vs buy", category: "opinion", difficulty: "B2", exampleContext: "Build vs buy depends on core competency." },
  "ai_bias": { vi: "thiên lệch AI", en: "AI bias", category: "opinion", difficulty: "B2", exampleContext: "AI bias requires diverse training data." },
  "tech_debt_investment": { vi: "đầu tư nợ kỹ thuật", en: "tech debt investment", category: "opinion", difficulty: "B2", exampleContext: "Tech debt investment prevents future pain." },
  "specialist_vs_generalist": { vi: "chuyên gia vs đa năng", en: "specialist vs generalist", category: "opinion", difficulty: "B2", exampleContext: "Specialist vs generalist career paths." },
  "impact_vs_title": { vi: "tác động vs chức danh", en: "impact vs title", category: "opinion", difficulty: "B2", exampleContext: "Impact vs title: choose impact." },
  "legacy_definition": { vi: "định nghĩa di sản", en: "legacy definition", category: "opinion", difficulty: "B2", exampleContext: "What's your legacy definition?" },
};

const CHUNKS_PER_DAY = 5;
const TOTAL_DAYS = 180;

function jsArrayToPgArray(arr: string[]): string {
  return "{" + arr.map(s => '"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"').join(",") + "}";
}

async function main() {
  console.log("🚀 180-day Chunks Generation (5 chunks/day = 900 chunks)\n");
  
  // Check existing
  const { data: existing } = await supabase.from("chunks").select("id");
  const existingIds = new Set(existing?.map(c => c.id) || []);
  console.log(`📊 Existing chunks in DB: ${existingIds.size}\n`);
  
  // Get all chunk keys in order (cycling through for 180 days)
  const allChunkKeys = Object.keys(CHUNK_DEFINITIONS);
  console.log(`📦 Total unique chunk definitions: ${allChunkKeys.length}`);
  
  let allChunks: any[] = [];
  let totalGenerated = 0;
  let totalSkipped = 0;
  
  for (let day = 1; day <= TOTAL_DAYS; day++) {
    const dayChunks: any[] = [];
    
    // Select 5 chunks for this day (cycle through definitions)
    for (let i = 0; i < CHUNKS_PER_DAY; i++) {
      const chunkIndex = ((day - 1) * CHUNKS_PER_DAY + i) % allChunkKeys.length;
      const chunkKey = allChunkKeys[chunkIndex];
      const def = CHUNK_DEFINITIONS[chunkKey];
      
      const id = `chunk-d${day}-${chunkKey}`;
      
      if (existingIds.has(id)) {
        totalSkipped++;
        continue;
      }
      
      dayChunks.push({
        id,
        day_index: day,
        chunk_key: chunkKey,
        vi_text: def.vi,
        en_text: def.en,
        category: def.category,
        difficulty: def.difficulty,
        example_context: def.exampleContext,
        created_at: new Date().toISOString(),
      });
      
      totalGenerated++;
    }
    
    allChunks.push(...dayChunks);
    
    if (day % 20 === 0) {
      console.log(`  📅 Day ${day}/180: ${dayChunks.length} chunks`);
    }
  }
  
  console.log(`\n📊 Summary: ${totalGenerated} new chunks, ${totalSkipped} skipped (existing)`);
  
  if (allChunks.length === 0) {
    console.log("✅ Nothing to insert. All chunks already exist.");
    return;
  }
  
  // Convert to DB format
  const dbChunks = allChunks.map(c => ({
    id: c.id,
    day_index: c.day_index,
    chunk_key: c.chunk_key,
    vi_text: c.vi_text,
    en_text: c.en_text,
    category: c.category,
    difficulty: c.difficulty,
    example_context: c.example_context,
    created_at: c.created_at,
  }));
  
  // Batch insert
  const batchSize = 100;
  let inserted = 0;
  
  for (let i = 0; i < dbChunks.length; i += batchSize) {
    const batch = dbChunks.slice(i, i + batchSize);
    const { error } = await supabase.from("chunks").insert(batch);
    if (error) {
      console.error(`❌ Batch ${i / batchSize + 1} failed:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`✅ Batch ${i / batchSize + 1} inserted (${batch.length} chunks)`);
    }
  }
  
  console.log(`\n🎉 Complete! ${inserted} chunks inserted into database.`);
}

main().catch(console.error);
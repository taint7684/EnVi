import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Objective = { id: string; text_vi: string; check: string };
type Persona = {
  name: string;
  role: string;
  personality: string;
  accent_hint?: string;
  speaking_speed?: string;
};
type OfflineTurn = { persona: string; sample: string };
type Mission = {
  id: string;
  title_vi: string;
  title_en: string;
  category: "work" | "life" | "travel" | "social";
  level: "A2" | "B1" | "B2";
  role_relevance: string[];
  scenario_vi: string;
  ai_persona: Persona;
  objectives: Objective[];
  prep_chunks: string[];
  strategy_card_id?: string | null;
  max_turns: number;
  success_rule: string;
  offline_script: OfflineTurn[];
};

function m(
  id: string,
  titleVi: string,
  titleEn: string,
  category: Mission["category"],
  level: Mission["level"],
  roles: string[],
  scenario: string,
  persona: Persona,
  objectives: [string, string][],
  prep: string[],
  card: string | null,
  turns: number,
  script: string[][],
): Mission {
  const flat = script.flat();
  const offline_script: OfflineTurn[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) {
    offline_script.push({ persona: flat[i], sample: flat[i + 1] });
  }
  return {
    id,
    title_vi: titleVi,
    title_en: titleEn,
    category,
    level,
    role_relevance: roles,
    scenario_vi: scenario,
    ai_persona: persona,
    objectives: objectives.map(([t, c], i) => ({ id: `o${i + 1}`, text_vi: t, check: c })),
    prep_chunks: prep,
    strategy_card_id: card,
    max_turns: turns,
    success_rule: ">= objectives-1 done",
    offline_script,
  };
}

const NEW_MISSIONS: Mission[] = [
  m("conflict-deadline", "Báo cáo trễ deadline", "Report a slipping deadline", "work", "B1", ["BA", "PM", "Dev", "All"],
    "Bạn phát hiện task sẽ trễ 2 ngày so với cam kết. Báo cho PM (người Anh) một cách trung thực, kèm lý do và phương án khắc phục.",
    { name: "Sarah", role: "Project Manager", personality: "Điềm tĩnh, coi trọng dữ liệu", accent_hint: "British", speaking_speed: "normal" },
    [["Nêu rõ task nào sẽ trễ", "Did the learner state which task will slip?"], ["Giải thích lý do", "Did the learner explain the cause?"], ["Đề xuất phương án", "Did the learner propose a recovery plan?"]],
    ["The task will be delayed by…", "The reason is…", "To recover, I suggest…", "Could we reprioritise…?"],
    "bad-news", 8,
    [["Which task is at risk?", "The login module will be delayed by two days."], ["What caused it?", "An API dependency is not ready yet."], ["How do you propose to recover?", "I suggest we parallelise testing and add one more reviewer."]]),
  m("req-workshop", "Workshop chốt yêu cầu", "Requirements workshop", "work", "B1", ["BA", "PM", "All"],
    "Bạn là BA chạy workshop với khách hàng (người Úc) để chốt yêu cầu cho một tính năng mới. Đặt câu hỏi làm rõ và tóm tắt lại.",
    { name: "Tom", role: "Client Representative", personality: "Nói nhiều, dễ lạc đề", accent_hint: "Australian", speaking_speed: "normal" },
    [["Đặt câu hỏi làm rõ", "Did the learner ask clarifying questions?"], ["Xác nhận yêu cầu", "Did the learner confirm requirements?"], ["Tóm tắt lại", "Did the learner summarise the outcome?"]],
    ["Could you clarify…?", "Just to confirm, you need…", "Let me summarise…", "Are there any constraints?"],
    "clarify", 10,
    [["Could you clarify what 'fast' means here?", "It should respond within two seconds."], ["Just to confirm, you need export to CSV?", "Yes, and also to Excel."], ["Let me summarise the requirements.", "Sounds good."]]),
  m("code-review", "Review code đồng nghiệp", "Review a colleague's code", "work", "B1", ["Dev", "All"],
    "Bạn review pull request của đồng nghiệp (người Mỹ). Nêu nhận xét lịch sự, chỉ ra vấn đề và đề xuất cải thiện.",
    { name: "Mike", role: "Senior Developer", personality: "Thẳng thắn, tôn trọng", accent_hint: "American", speaking_speed: "normal" },
    [["Nêu nhận xét lịch sự", "Did the learner give polite feedback?"], ["Chỉ ra vấn đề", "Did the learner point out the issue?"], ["Đề xuất cải thiện", "Did the learner suggest an improvement?"]],
    ["Thanks for the PR!", "One thing I noticed…", "Could we consider…?", "What do you think about…?"],
    "disagree", 8,
    [["Thanks for the PR! One thing I noticed…", "Go on."], ["Could we consider handling the null case?", "Good catch, I'll fix it."], ["What do you think about adding a test?", "Agreed."]]),
  m("client-call-sales", "Gọi chào hàng cho khách", "Sales call to a prospect", "work", "B2", ["BA", "PM", "All"],
    "Bạn gọi cho khách hàng tiềm năng (người Anh) để giới thiệu dịch vụ. Xử lý từ chối lịch sự và chốt bước tiếp theo.",
    { name: "Emma", role: "Procurement Lead", personality: "Bận rộn, hoài nghi", accent_hint: "British", speaking_speed: "fast" },
    [["Giới thiệu ngắn gọn", "Did the learner pitch concisely?"], ["Xử lý từ chối", "Did the learner handle the objection?"], ["Chốt bước tiếp theo", "Did the learner agree a next step?"]],
    ["I'm calling about…", "Would you be open to…?", "I understand, but…", "Shall we schedule a demo?"],
    "follow-up", 8,
    [["I'm calling about our automation service.", "We already have a vendor."], ["I understand, but could I show you a quick comparison?", "Fine, go ahead."], ["Shall we schedule a 15-minute demo?", "Yes, next Tuesday."]]),
  m("retro-meeting", "Họp retrospective", "Sprint retrospective", "work", "B1", ["Dev", "Tester", "PM", "All"],
    "Bạn tham gia họp retrospective cuối sprint (facilitator người New Zealand). Chia sẻ điều tốt/chưa tốt và đề xuất cải tiến.",
    { name: "Anna", role: "Scrum Master", personality: "Khuyến khích, công bằng", accent_hint: "New Zealand", speaking_speed: "normal" },
    [["Nêu điều tốt", "Did the learner mention what went well?"], ["Nêu điều chưa tốt", "Did the learner mention what went wrong?"], ["Đề xuất cải tiến", "Did the learner propose an improvement?"]],
    ["What went well was…", "The challenge was…", "I suggest we…", "Maybe we could…"],
    "summarize", 8,
    [["What went well this sprint?", "We delivered the core features on time."], ["What was challenging?", "Code reviews took too long."], ["Any improvement ideas?", "Maybe we could set a review SLA."]]),
  m("handover-doc", "Bàn giao tài liệu", "Knowledge handover", "work", "B1", ["Dev", "BA", "All"],
    "Bạn bàn giao một module cho đồng nghiệp mới (người Ấn Độ). Giải thích kiến trúc, luồng và các lưu ý.",
    { name: "Raj", role: "New Developer", personality: "Tò mò, hỏi nhiều", accent_hint: "Indian", speaking_speed: "normal" },
    [["Giải thích tổng quan", "Did the learner explain the overview?"], ["Mô tả luồng chính", "Did the learner describe the main flow?"], ["Nêu lưu ý", "Did the learner mention caveats?"]],
    ["The module is responsible for…", "The flow starts at…", "Watch out for…", "Let me walk you through…"],
    "hand-off", 10,
    [["The module is responsible for user auth.", "Where does the flow start?", "The flow starts at the login handler."], ["Any caveats?", "Watch out for the token refresh logic."], ["Let me walk you through the config.", "Thanks."]]),
  m("onboarding-buddy", "Đón thành viên mới", "Welcome a new team member", "work", "A2", ["Dev", "All"],
    "Bạn là buddy đón một thành viên mới (người Philippines). Giới thiệu team, công cụ và lịch làm việc.",
    { name: "Jo", role: "New Hire", personality: "Thân thiện, hơi lo lắng", accent_hint: "Filipino", speaking_speed: "normal" },
    [["Giới thiệu team", "Did the learner introduce the team?"], ["Nói về công cụ", "Did the learner mention the tools?"], ["Nêu lịch làm việc", "Did the learner explain the schedule?"]],
    ["Welcome to the team!", "We use… for…", "Our standup is at…", "Let me know if you need…"],
    "hand-off", 8,
    [["Welcome to the team! We are six people.", "Nice to meet you."], ["We use Slack and Jira for daily work.", "Got it."], ["Our standup is at 9:30 every day.", "Thank you!"]]),
  m("negotiate-scope", "Đàm phán phạm vi", "Negotiate scope with client", "work", "B2", ["BA", "PM", "All"],
    "Khách hàng (người Mỹ) muốn thêm tính năng ngoài phạm vi. Bạn đàm phán để giữ scope hoặc đổi lấy thời gian/ngân sách.",
    { name: "David", role: "Client Sponsor", personality: "Quyết đoán, bận rộn", accent_hint: "American", speaking_speed: "fast" },
    [["Từ chối lịch sự", "Did the learner decline politely?"], ["Đề xuất đánh đổi", "Did the learner propose a trade-off?"], ["Chốt thoả thuận", "Did the learner confirm the agreement?"]],
    ["That's outside the current scope.", "We could add it if…", "Would you be open to…?", "Let's agree on…"],
    "disagree", 8,
    [["We also want a mobile app.", "That's outside the current scope, but we could add it in phase two."], ["We need it now.", "Would you be open to extending the timeline by two weeks?"], ["Agreed, let's do that.", "Let's confirm it in writing."]]),
  m("bug-triage", "Phân loại lỗi", "Bug triage call", "work", "B1", ["Dev", "Tester", "All"],
    "Bạn triage một lỗi nghiêm trọng với tester và dev (người Anh). Xác định mức độ, tái hiện và người xử lý.",
    { name: "Olivia", role: "QA Lead", personality: "Chi tiết, thực tế", accent_hint: "British", speaking_speed: "normal" },
    [["Mô tả lỗi", "Did the learner describe the bug?"], ["Đánh giá mức độ", "Did the learner assess severity?"], ["Phân công", "Did the learner assign an owner?"]],
    ["The bug is…", "It happens when…", "I'd rate it as…", "Can you take this?"],
    "bluf", 8,
    [["The bug is that login fails on Safari.", "When does it happen?", "It happens when the session expires."], ["How severe is it?", "I'd rate it as high, it blocks login."], ["Can you take this?", "Yes, I'll pick it up."]]),
  m("daily-standup-b2", "Daily standup nâng cao", "Advanced daily standup", "work", "B2", ["Dev", "PM", "All"],
    "Daily standup với PM người Úc. Ngoài cập nhật, bạn nêu rủi ro và đề xuất hỗ trợ chéo.",
    { name: "Jack", role: "Engineering Manager", personality: "Thẳng, coi trọng chủ động", accent_hint: "Australian", speaking_speed: "normal" },
    [["Cập nhật công việc", "Did the learner give a concise update?"], ["Nêu rủi ro", "Did the learner raise a risk?"], ["Đề xuất hỗ trợ", "Did the learner suggest cross-support?"]],
    ["Yesterday I…", "Today I'm focusing on…", "A risk I foresee is…", "Could we pair on…?"],
    "bluf", 8,
    [["Yesterday I closed three tickets.", "Any risks?", "A risk I foresee is the payment API delay."], ["Could we pair on it?", "Sure, let's pair after standup."], ["Today I'm focusing on the dashboard.", "Great."]]),
  m("presentation-pitch", "Thuyết trình ý tưởng", "Pitch an idea", "work", "B2", ["BA", "PM", "All"],
    "Bạn pitch một ý tưởng cải tiến quy trình cho quản lý (người Mỹ). Nêu vấn đề, giải pháp và lợi ích.",
    { name: "Chris", role: "Director", personality: "Nghi ngờ, thích số liệu", accent_hint: "American", speaking_speed: "fast" },
    [["Nêu vấn đề", "Did the learner state the problem?"], ["Trình bày giải pháp", "Did the learner present the solution?"], ["Nêu lợi ích", "Did the learner quantify the benefit?"]],
    ["The problem is…", "My proposal is…", "This would save…", "The ROI would be…"],
    "prep", 10,
    [["The problem is manual testing takes too long.", "What's your proposal?", "My proposal is to automate regression tests."], ["What's the benefit?", "This would save 10 hours per sprint."], ["Let's trial it next sprint.", "Agreed."]]),
  m("interview-hr", "Phỏng vấn nhân sự", "HR interview", "work", "B1", ["All"],
    "Bạn phỏng vấn với HR (người Anh) cho vị trí BA. Trả lời về bản thân, kinh nghiệm và lý do ứng tuyển.",
    { name: "Grace", role: "HR Manager", personality: "Thân thiện, quan sát", accent_hint: "British", speaking_speed: "normal" },
    [["Giới thiệu bản thân", "Did the learner introduce themselves?"], ["Nói về kinh nghiệm", "Did the learner describe experience?"], ["Nêu lý do", "Did the learner explain motivation?"]],
    ["I have experience in…", "My strength is…", "I'm interested in this role because…", "In my last job, I…"],
    "prep", 8,
    [["Tell me about yourself.", "I have three years of experience as a BA."], ["Why this role?", "I'm interested because I enjoy solving real problems."], ["Great, let's continue.", "Thank you."]]),
  m("salary-negotiation", "Đàm phán lương", "Salary negotiation", "work", "B2", ["All"],
    "Bạn đàm phán mức lương với HR (người Mỹ). Nêu kỳ vọng dựa trên thị trường và kỹ năng.",
    { name: "Mark", role: "HR Business Partner", personality: "Lịch sự, kiên định", accent_hint: "American", speaking_speed: "normal" },
    [["Nêu kỳ vọng", "Did the learner state an expectation?"], ["Dẫn lý do", "Did the learner justify it?"], ["Tìm tiếng nói chung", "Did the learner seek common ground?"]],
    ["Based on my research…", "I was hoping for…", "Given my skills in…", "Could we meet in the middle?"],
    "disagree", 8,
    [["What are your salary expectations?", "Based on my research, I was hoping for 20 million."], ["That's above our budget.", "Given my skills in BA and testing, could we meet in the middle?"], ["Let me get back to you.", "Thank you."]]),
  m("flight-booking", "Đặt vé máy bay", "Book a flight", "travel", "A2", ["All"],
    "Bạn gọi đặt vé máy bay (nhân viên người Philippines). Hỏi giờ, giá, hành lý và xác nhận đặt chỗ.",
    { name: "Liza", role: "Booking Agent", personality: "Nhanh nhẹn, hiệu quả", accent_hint: "Filipino", speaking_speed: "fast" },
    [["Hỏi chuyến bay", "Did the learner ask about flights?"], ["Hỏi giá/hành lý", "Did the learner ask about price/baggage?"], ["Xác nhận", "Did the learner confirm the booking?"]],
    ["I'd like to book a flight to…", "What time does it leave?", "How much is a ticket?", "Can I have oneway or return?"],
    null, 8,
    [["I'd like to book a flight to Da Nang.", "When do you want to travel?", "What time does it leave?", "It leaves at 8 AM."], ["How much is a ticket?", "It's 1,200,000 VND."], ["Can I have a return ticket?", "Sure, let me confirm."]]),
  m("hotel-checkin", "Nhận phòng khách sạn", "Hotel check-in problem", "travel", "A2", ["All"],
    "Bạn nhận phòng khách sạn (lễ tân người Thái) nhưng phòng chưa sẵn sàng. Giải quyết lịch sự.",
    { name: "Nok", role: "Front Desk", personality: "Lịch sự, giúp đỡ", accent_hint: "Thai", speaking_speed: "normal" },
    [["Nêu vấn đề", "Did the learner state the issue?"], ["Hỏi giải pháp", "Did the learner ask for a solution?"], ["Chốt", "Did the learner confirm a resolution?"]],
    ["I have a reservation under…", "My room isn't ready yet.", "Could you…?", "That would be great."],
    "repair", 8,
    [["I have a reservation under Nguyen.", "Let me check… the room isn't ready yet."], ["Could you store my luggage?", "Of course."], ["That would be great, thank you.", "You're welcome."]]),
  m("restaurant-complaint", "Khiếu nại nhà hàng", "Restaurant complaint", "travel", "B1", ["All"],
    "Món ăn ở nhà hàng (quản lý người Úc) không đúng như gọi. Bạn khiếu nại lịch sự và đề nghị giải pháp.",
    { name: "Bruce", role: "Restaurant Manager", personality: "Xin lỗi, muốn bù đắp", accent_hint: "Australian", speaking_speed: "normal" },
    [["Mô tả vấn đề", "Did the learner describe the problem?"], ["Đề nghị giải pháp", "Did the learner request a solution?"], ["Cảm ơn", "Did the learner close politely?"]],
    ["Excuse me, this isn't what I ordered.", "Could you…?", "I'd appreciate…", "Thank you for sorting it out."],
    "bad-news", 8,
    [["Excuse me, this isn't what I ordered.", "I'm so sorry, let me fix that."], ["Could you also check the bill?", "Of course."], ["Thank you for sorting it out.", "My pleasure."]]),
  m("airport-transfer", "Xin chỉ đường sân bay", "Ask for airport transfer", "travel", "A2", ["All"],
    "Bạn hỏi nhân viên sân bay (người Singapore) cách ra taxi và thời gian di chuyển.",
    { name: "Wei", role: "Airport Staff", personality: "Hữu ích, rõ ràng", accent_hint: "Singaporean", speaking_speed: "normal" },
    [["Hỏi đường", "Did the learner ask for directions?"], ["Hỏi thời gian", "Did the learner ask about time?"], ["Cảm ơn", "Did the learner thank?"]],
    ["Excuse me, where is the taxi stand?", "How long does it take?", "How much is it?", "Thank you for your help."],
    null, 6,
    [["Excuse me, where is the taxi stand?", "Go straight and turn left."], ["How long does it take to the city?", "About 20 minutes."], ["Thank you for your help.", "You're welcome."]]),
  m("travel-insurance", "Mua bảo hiểm du lịch", "Buy travel insurance", "travel", "B1", ["All"],
    "Bạn mua bảo hiểm du lịch qua điện thoại (nhân viên người Anh). Hỏi về quyền lợi, loại trừ và chi phí.",
    { name: "Helen", role: "Insurance Agent", personality: "Kiên nhẫn, chi tiết", accent_hint: "British", speaking_speed: "normal" },
    [["Hỏi quyền lợi", "Did the learner ask about coverage?"], ["Hỏi loại trừ", "Did the learner ask about exclusions?"], ["Chốt", "Did the learner confirm purchase?"]],
    ["What does the policy cover?", "Are there any exclusions?", "How much is the premium?", "I'd like to proceed."],
    "clarify", 8,
    [["What does the policy cover?", "It covers medical and lost baggage."], ["Are there any exclusions?", "Pre-existing conditions are excluded."], ["I'd like to proceed.", "Certainly."]]),
  m("doctor-appointment", "Đặt lịch khám bệnh", "Book a doctor appointment", "life", "B1", ["All"],
    "Bạn gọi phòng khám (lễ tân người Mỹ) để đặt lịch khám. Mô tả triệu chứng và hỏi lịch trống.",
    { name: "Susan", role: "Clinic Receptionist", personality: "Cẩn thận, thân thiện", accent_hint: "American", speaking_speed: "normal" },
    [["Mô tả triệu chứng", "Did the learner describe symptoms?"], ["Hỏi lịch", "Did the learner ask about availability?"], ["Xác nhận", "Did the learner confirm appointment?"]],
    ["I'd like to book an appointment.", "I've been having…", "Do you have any slots…?", "That works for me."],
    null, 8,
    [["I'd like to book an appointment.", "What's the reason?", "I've been having headaches for a week."], ["Do you have any slots this week?", "Yes, Thursday at 2 PM."], ["That works for me.", "Great, you're booked."]]),
  m("apartment-viewing", "Xem nhà thuê", "View an apartment", "life", "B1", ["All"],
    "Bạn đi xem căn hộ thuê (chủ nhà người Úc). Hỏi về giá, tiện ích, hợp đồng và đặt cọc.",
    { name: "Dave", role: "Landlord", personality: "Thẳng thắn, bận rộn", accent_hint: "Australian", speaking_speed: "normal" },
    [["Hỏi giá/tiện ích", "Did the learner ask about rent/utilities?"], ["Hỏi hợp đồng", "Did the learner ask about the contract?"], ["Chốt", "Did the learner decide next steps?"]],
    ["How much is the rent?", "Are utilities included?", "What's the deposit?", "Can I think about it?"],
    "clarify", 8,
    [["How much is the rent?", "It's 5 million per month."], ["Are utilities included?", "No, they're separate."], ["Can I think about it?", "Sure, let me know by Friday."]]),
  m("bank-account", "Mở tài khoản ngân hàng", "Open a bank account", "life", "B1", ["All"],
    "Bạn mở tài khoản ngân hàng (nhân viên người Singapore). Hỏi về thủ tục, phí và thẻ.",
    { name: "Serene", role: "Bank Officer", personality: "Chuyên nghiệp, rõ ràng", accent_hint: "Singaporean", speaking_speed: "normal" },
    [["Hỏi thủ tục", "Did the learner ask about requirements?"], ["Hỏi phí", "Did the learner ask about fees?"], ["Chốt", "Did the learner proceed?"]],
    ["What do I need to open an account?", "Are there any fees?", "Do I get a debit card?", "Let's proceed."],
    "clarify", 8,
    [["What do I need to open an account?", "Your passport and proof of address."], ["Are there any fees?", "No monthly fee."], ["Let's proceed.", "Great."]]),
  m("gym-signup", "Đăng ký phòng gym", "Join a gym", "life", "A2", ["All"],
    "Bạn đăng ký phòng gym (nhân viên người Mỹ). Hỏi về gói tập, giờ mở cửa và huấn luyện viên.",
    { name: "Tyler", role: "Gym Staff", personality: "Năng động, thân thiện", accent_hint: "American", speaking_speed: "fast" },
    [["Hỏi gói tập", "Did the learner ask about plans?"], ["Hỏi giờ", "Did the learner ask about hours?"], ["Chốt", "Did the learner sign up?"]],
    ["What plans do you have?", "When do you open?", "Is a trainer included?", "I'd like to sign up."],
    null, 6,
    [["What plans do you have?", "We have monthly and yearly plans."], ["When do you open?", "We open at 6 AM."], ["I'd like to sign up.", "Welcome aboard!"]]),
  m("small-talk-elevator", "Tán gẫu thang máy", "Elevator small talk", "social", "A2", ["All"],
    "Bạn gặp đồng nghiệp (người Anh) trong thang máy. Trao đổi vài câu xã giao ngắn.",
    { name: "Ben", role: "Colleague", personality: "Thân thiện, thoải mái", accent_hint: "British", speaking_speed: "normal" },
    [["Chào hỏi", "Did the learner greet?"], ["Hỏi thăm", "Did the learner ask a light question?"], ["Kết thúc", "Did the learner close politely?"]],
    ["Hi, how's it going?", "Nice weather today, isn't it?", "Have a good day!", "See you later."],
    null, 4,
    [["Hi, how's it going?", "Pretty good, thanks!"], ["Nice weather today, isn't it?", "Yes, finally sunny."], ["Have a good day!", "You too."]]),
  m("coffee-chat", "Cà phê với đồng nghiệp", "Coffee chat with a teammate", "social", "B1", ["All"],
    "Bạn đi cà phê với đồng nghiệp (người Canada). Trò chuyện về công việc, sở thích và cuối tuần.",
    { name: "Al", role: "Teammate", personality: "Dễ mến, tò mò", accent_hint: "Canadian", speaking_speed: "normal" },
    [["Hỏi thăm", "Did the learner ask about the colleague?"], ["Chia sẻ", "Did the learner share something?"], ["Duy trì hội thoại", "Did the learner keep the conversation going?"]],
    ["How was your weekend?", "I've been meaning to ask…", "By the way…", "What do you think about…?"],
    "follow-up", 8,
    [["How was your weekend?", "It was relaxing, thanks."], ["I've been meaning to ask about the project.", "Sure, go ahead."], ["What do you think about the new tool?", "Looks promising."]]),
  m("networking-event", "Kết bạn sự kiện", "Networking at an event", "social", "B2", ["All"],
    "Bạn tham gia sự kiện công nghệ (người Anh). Tự giới thiệu, trao đổi ý tưởng và giữ liên hệ.",
    { name: "Simon", role: "Attendee", personality: "Tự tin, cởi mở", accent_hint: "British", speaking_speed: "normal" },
    [["Tự giới thiệu", "Did the learner introduce themselves?"], ["Trao đổi", "Did the learner exchange ideas?"], ["Giữ liên hệ", "Did the learner suggest staying in touch?"]],
    ["I work as…", "What do you do?", "That's interesting because…", "Let's connect on LinkedIn."],
    "hand-off", 8,
    [["I work as a BA in fintech.", "What do you do?", "That's interesting because we're solving the same problem."], ["Let's connect on LinkedIn.", "Sounds good."], ["Great chatting with you.", "Likewise."]]),
  m("apology-mistake", "Xin lỗi vì sai sót", "Apologise for a mistake", "work", "B1", ["All"],
    "Bạn mắc lỗi gửi sai file cho khách hàng (người Mỹ). Chủ động xin lỗi và khắc phục.",
    { name: "Rachel", role: "Client", personality: "Khó chịu lúc đầu", accent_hint: "American", speaking_speed: "normal" },
    [["Xin lỗi", "Did the learner apologise?"], ["Giải thích", "Did the learner explain briefly?"], ["Khắc phục", "Did the learner fix it?"]],
    ["I'm sorry about…", "This was my mistake.", "I've already…", "To make it right…"],
    "bad-news", 8,
    [["I'm sorry about sending the wrong file.", "This is frustrating."], ["This was my mistake, I've already sent the correct one.", "Thank you."], ["To make it right, I'll double-check next time.", "Appreciate it."]]),
  m("ask-for-feedback", "Xin phản hồi", "Ask for feedback", "work", "B1", ["All"],
    "Bạn xin phản hồi từ quản lý (người New Zealand) về bài thuyết trình vừa rồi.",
    { name: "Fiona", role: "Manager", personality: "Xây dựng, thẳng thắn", accent_hint: "New Zealand", speaking_speed: "normal" },
    [["Xin phản hồi", "Did the learner request feedback?"], ["Hỏi cụ thể", "Did the learner ask specific questions?"], ["Tiếp thu", "Did the learner acknowledge?"]],
    ["Could I get your feedback on…?", "What went well?", "What could I improve?", "Thanks, I'll work on that."],
    "follow-up", 8,
    [["Could I get your feedback on the presentation?", "Sure, it was clear."], ["What could I improve?", "Maybe slow down a bit."], ["Thanks, I'll work on that.", "Good attitude."]]),
];

const MORE_MISSIONS: Mission[] = [
  m("project-kickoff", "Khai mạc dự án", "Project kickoff", "work", "B1", ["BA", "PM", "All"],
    "Bạn phát biểu khai mạc dự án mới với team (PM người Anh). Nêu mục tiêu, phạm vi và vai trò.",
    { name: "Paul", role: "Project Manager", personality: "Rõ ràng, có tổ chức", accent_hint: "British", speaking_speed: "normal" },
    [["Nêu mục tiêu", "Did the learner state the goal?"], ["Nêu phạm vi", "Did the learner outline the scope?"], ["Nêu vai trò", "Did the learner clarify roles?"]],
    ["Our goal is to…", "The scope includes…", "You'll be responsible for…", "Let's get started."],
    "prep", 8,
    [["Our goal is to launch the app by June.", "What's in scope?", "The scope includes web and mobile."], ["You'll be responsible for testing.", "Understood."], ["Let's get started.", "Excited!"]]),
  m("risk-review", "Họp rà soát rủi ro", "Risk review meeting", "work", "B2", ["BA", "PM", "Dev", "All"],
    "Bạn trình bày rủi ro dự án cho stakeholder (người Mỹ). Đánh giá khả năng, tác động và biện pháp giảm thiểu.",
    { name: "Karen", role: "Stakeholder", personality: "Thực tế, thích con số", accent_hint: "American", speaking_speed: "normal" },
    [["Nêu rủi ro", "Did the learner identify the risk?"], ["Đánh giá", "Did the learner assess likelihood/impact?"], ["Biện pháp", "Did the learner propose mitigation?"]],
    ["The main risk is…", "It's likely to…", "To mitigate this…", "The impact would be…"],
    "prep", 8,
    [["The main risk is the third-party API delay.", "How likely is that?", "It's likely to happen within a month."], ["To mitigate this, we'll add a mock.", "The impact would be?", "A two-week delay at most."], ["Sounds manageable.", "We'll monitor it."]]),
  m("support-ticket", "Xử lý ticket hỗ trợ", "Handle a support ticket", "work", "B1", ["Dev", "Tester", "All"],
    "Bạn hỗ trợ khách hàng (người Úc) qua ticket về lỗi đăng nhập. Hỏi thông tin và hướng dẫn khắc phục.",
    { name: "Nina", role: "Customer", personality: "Hơi bực, cần giúp", accent_hint: "Australian", speaking_speed: "normal" },
    [["Hỏi thông tin", "Did the learner gather details?"], ["Hướng dẫn", "Did the learner guide a fix?"], ["Xác nhận", "Did the learner confirm resolution?"]],
    ["Could you tell me…?", "Have you tried…?", "Let's try…", "Is it working now?"],
    "clarify", 8,
    [["Could you tell me which browser you use?", "Chrome, latest version."], ["Have you tried clearing the cache?", "Not yet."], ["Let's try that and sign in again.", "Is it working now?", "Yes, thank you!"]]),
  m("sprint-planning", "Lập kế hoạch sprint", "Sprint planning", "work", "B1", ["Dev", "PM", "All"],
    "Bạn tham gia sprint planning (SM người New Zealand). Ước lượng task và cam kết khối lượng.",
    { name: "Kiri", role: "Scrum Master", personality: "Khuyến khích, thực tế", accent_hint: "New Zealand", speaking_speed: "normal" },
    [["Hiểu task", "Did the learner clarify tasks?"], ["Ước lượng", "Did the learner estimate effort?"], ["Cam kết", "Did the learner commit to a sprint goal?"]],
    ["Can you clarify…?", "I'd estimate…", "We can commit to…", "That sounds doable."],
    "clarify", 8,
    [["Can you clarify the login task?", "It includes social login too."], ["I'd estimate three days.", "Okay."], ["We can commit to five stories.", "That sounds doable."]]),
  m("escalation-call", "Gọi leo thang", "Escalation call", "work", "B2", ["BA", "PM", "All"],
    "Bạn leo thang vấn đề chặn tiến độ lên quản lý cấp cao (người Mỹ). Trình bày dứt khoát và đề nghị quyết định.",
    { name: "Greg", role: "Senior Director", personality: "Không kiên nhẫn, quyết đoán", accent_hint: "American", speaking_speed: "fast" },
    [["Nêu vấn đề", "Did the learner state the blocker?"], ["Tác động", "Did the learner explain the impact?"], ["Đề nghị", "Did the learner ask for a decision?"]],
    ["I need to escalate…", "This is blocking…", "The impact is…", "I need a decision on…"],
    "bluf", 8,
    [["I need to escalate a resourcing issue.", "Go on."], ["This is blocking the payment module.", "What's the impact?"], ["The impact is a two-week delay. I need a decision on hiring.", "I'll approve one contractor."]]),
  m("all-hands", "Họp toàn công ty", "All-hands update", "work", "B2", ["All"],
    "Bạn cập nhật tiến độ dự án trong buổi all-hands (CEO người Anh). Nói ngắn gọn, tự tin.",
    { name: "Helen", role: "CEO", personality: "Tập trung vào kết quả", accent_hint: "British", speaking_speed: "normal" },
    [["Tóm tắt tiến độ", "Did the learner summarise progress?"], ["Nêu kết quả", "Did the learner highlight results?"], ["Kết luận", "Did the learner close confidently?"]],
    ["We've made good progress on…", "The key result is…", "Looking ahead…", "Thanks for your support."],
    "summarize", 8,
    [["We've made good progress on the platform.", "What's the key result?", "The key result is a 30% faster load time."], ["Looking ahead, we'll focus on mobile.", "Great."], ["Thanks for your support.", "Keep it up."]]),
  m("vendor-call", "Gọi nhà cung cấp", "Call a vendor", "work", "B1", ["BA", "PM", "All"],
    "Bạn gọi nhà cung cấp (người Ấn Độ) để hỏi tiến độ giao hàng và đàm phán thời gian.",
    { name: "Priya", role: "Vendor Manager", personality: "Lịch sự, thương lượng", accent_hint: "Indian", speaking_speed: "normal" },
    [["Hỏi tiến độ", "Did the learner ask about status?"], ["Nêu yêu cầu", "Did the learner state the requirement?"], ["Chốt", "Did the learner agree a date?"]],
    ["Could you update me on…?", "We need it by…", "Is that possible?", "Let's confirm the date."],
    "follow-up", 8,
    [["Could you update me on the delivery?", "It's on track for Friday."], ["We need it by Wednesday. Is that possible?", "Let me check with the team."], ["Let's confirm the date.", "Wednesday works."]]),
  m("training-session", "Hướng dẫn sử dụng", "Run a training session", "work", "B1", ["Dev", "BA", "All"],
    "Bạn hướng dẫn người dùng cuối (người Philippines) dùng tính năng mới. Giải thích từng bước.",
    { name: "Mia", role: "End User", personality: "Chưa quen công nghệ", accent_hint: "Filipino", speaking_speed: "normal" },
    [["Giải thích", "Did the learner explain the feature?"], ["Hướng dẫn", "Did the learner guide step by step?"], ["Kiểm tra", "Did the learner check understanding?"]],
    ["First, you…", "Then, click on…", "Does that make sense?", "Any questions?"],
    "prep", 10,
    [["First, you log in with your email.", "Okay."], ["Then, click on the report tab.", "Does that make sense?", "Yes, I see it."], ["Any questions?", "No, thank you!"]]),
  m("team-conflict", "Hoà giải mâu thuẫn", "Mediate a team conflict", "work", "B2", ["PM", "All"],
    "Hai đồng nghiệp (người Anh) mâu thuẫn về cách làm. Bạn hoà giải và tìm giải pháp chung.",
    { name: "Alice", role: "Team Lead", personality: "Căng thẳng, cần lắng nghe", accent_hint: "British", speaking_speed: "normal" },
    [["Lắng nghe", "Did the learner acknowledge both sides?"], ["Tìm điểm chung", "Did the learner find common ground?"], ["Đề xuất", "Did the learner propose a solution?"]],
    ["I understand both of you…", "Let's focus on…", "What if we…?", "Can we agree on…?"],
    "repair", 10,
    [["I understand both of you have valid points.", "He never listens to me."], ["Let's focus on the shared goal.", "Okay."], ["What if we split the work?", "Can we agree on that?", "Yes."]]),
  m("interview-technical", "Phỏng vấn kỹ thuật", "Technical interview", "work", "B2", ["Dev", "All"],
    "Bạn phỏng vấn kỹ thuật (interviewer người Mỹ). Giải thích cách tiếp cận và trả lời câu hỏi kỹ thuật.",
    { name: "Steve", role: "Tech Lead", personality: "Sâu, hỏi liên tục", accent_hint: "American", speaking_speed: "normal" },
    [["Giải thích", "Did the learner explain their approach?"], ["Xử lý câu hỏi", "Did the learner answer technical questions?"], ["Hỏi lại", "Did the learner ask clarifying questions?"]],
    ["My approach would be…", "First, I'd…", "Could you clarify…?", "That's a good question."],
    "clarify", 10,
    [["My approach would be to profile first.", "Why profile first?"], ["First, I'd measure before optimising.", "Could you clarify the trade-off?", "It's about speed versus memory."], ["That's a good question.", "Thanks."]]),
  m("order-food-office", "Gọi đồ ăn văn phòng", "Order food for the office", "work", "A2", ["All"],
    "Bạn gọi đặt đồ ăn cho cả team (nhân viên người Việt). Hỏi món, số lượng và địa chỉ giao.",
    { name: "Lan", role: "Restaurant Staff", personality: "Nhanh, thân thiện", accent_hint: "Vietnamese", speaking_speed: "fast" },
    [["Gọi món", "Did the learner order items?"], ["Nêu số lượng", "Did the learner specify quantities?"], ["Địa chỉ", "Did the learner give the address?"]],
    ["I'd like to order…", "Two portions of…", "Can you deliver to…?", "How long does it take?"],
    null, 6,
    [["I'd like to order three chicken rice.", "Anything to drink?", "Two portions of iced tea.", "Can you deliver to our office?", "How long?", "About 30 minutes."]]),
  m("client-visit", "Tiếp khách hàng", "Host a client visit", "work", "B1", ["BA", "PM", "All"],
    "Bạn đón khách hàng (người Úc) đến thăm công ty. Giới thiệu, dẫn đi tham quan và trao đổi.",
    { name: "Bruce", role: "Client", personality: "Thân thiện, quan sát", accent_hint: "Australian", speaking_speed: "normal" },
    [["Chào đón", "Did the learner welcome the client?"], ["Giới thiệu", "Did the learner introduce the office/team?"], ["Trao đổi", "Did the learner discuss business?"]],
    ["Welcome to our office!", "Let me show you around.", "This is where…", "Shall we discuss…?"],
    "hand-off", 8,
    [["Welcome to our office! Let me show you around.", "Looks nice."], ["This is where our team works.", "How many people?", "Shall we discuss the project?", "Yes, please."]]),
  m("bug-report-write", "Viết báo cáo lỗi", "Write a bug report", "work", "B1", ["Dev", "Tester", "All"],
    "Bạn báo cáo một lỗi cho dev (người Anh) qua chat. Mô tả rõ bước tái hiện và kết quả mong đợi.",
    { name: "Tom", role: "Developer", personality: "Cần thông tin rõ", accent_hint: "British", speaking_speed: "normal" },
    [["Mô tả lỗi", "Did the learner describe the bug?"], ["Bước tái hiện", "Did the learner give reproduction steps?"], ["Kỳ vọng", "Did the learner state expected behaviour?"]],
    ["I found a bug where…", "To reproduce: 1)… 2)…", "Expected:… Actual:…", "Can you look into it?"],
    "bluf", 8,
    [["I found a bug where search returns nothing.", "To reproduce?", "To reproduce: 1) type a name 2) press search."], ["Expected: results. Actual: empty.", "Can you look into it?", "Will do."]]),
  m("welcome-newcomer", "Chào thành viên mới", "Welcome a new joiner", "social", "A2", ["All"],
    "Bạn chào một thành viên mới (người Canada) trong ngày đầu. Giới thiệu bản thân và giúp họ thoải mái.",
    { name: "Sam", role: "New Joiner", personality: "Hơi ngại, thân thiện", accent_hint: "Canadian", speaking_speed: "normal" },
    [["Chào", "Did the learner greet warmly?"], ["Giới thiệu", "Did the learner introduce themselves?"], ["Giúp đỡ", "Did the learner offer help?"]],
    ["Hi, welcome!", "I'm… from…", "Let me know if…", "Make yourself at home."],
    null, 6,
    [["Hi, welcome! I'm Minh from the dev team.", "Nice to meet you."], ["Let me know if you need anything.", "Thanks, that's kind."], ["Make yourself at home.", "I appreciate it."]]),
  m("weekend-plans", "Trò chuyện cuối tuần", "Chat about weekend plans", "social", "A2", ["All"],
    "Bạn trò chuyện với đồng nghiệp (người Anh) về kế hoạch cuối tuần. Hỏi và chia sẻ.",
    { name: "Lucy", role: "Colleague", personality: "Vui vẻ, thích ngoài trời", accent_hint: "British", speaking_speed: "normal" },
    [["Hỏi kế hoạch", "Did the learner ask about plans?"], ["Chia sẻ", "Did the learner share their plan?"], ["Chúc", "Did the learner close warmly?"]],
    ["Any plans for the weekend?", "I'm thinking of…", "How about you?", "Have a great weekend!"],
    null, 6,
    [["Any plans for the weekend?", "I'm thinking of hiking."], ["How about you?", "I'll relax at home."], ["Have a great weekend!", "You too!"]]),
  m("thank-you-note", "Ghi lời cảm ơn", "Write a thank-you note", "social", "B1", ["All"],
    "Bạn viết tin nhắn cảm ơn đồng nghiệp (người Mỹ) đã giúp bạn hoàn thành task gấp.",
    { name: "Dan", role: "Colleague", personality: "Khiêm tốn, bận rộn", accent_hint: "American", speaking_speed: "normal" },
    [["Cảm ơn", "Did the learner express thanks?"], ["Nêu cụ thể", "Did the learner mention the specific help?"], ["Đáp lại", "Did the learner offer reciprocity?"]],
    ["Thank you so much for…", "I really appreciate…", "Let me know if I can…", "I owe you one."],
    null, 6,
    [["Thank you so much for reviewing my code late yesterday.", "No problem."], ["I really appreciate you staying back.", "Happy to help."], ["Let me know if I can return the favour.", "Will do, thanks!"]]),
  m("directions-city", "Hỏi đường trong phố", "Ask for directions in a city", "travel", "A2", ["All"],
    "Bạn hỏi đường đến bảo tàng (người dân địa phương nói tiếng Anh). Ghi nhớ chỉ dẫn.",
    { name: "Mia", role: "Local", personality: "Thân thiện, nói nhanh", accent_hint: "American", speaking_speed: "fast" },
    [["Hỏi đường", "Did the learner ask for directions?"], ["Nhắc lại", "Did the learner confirm understanding?"], ["Cảm ơn", "Did the learner thank?"]],
    ["Excuse me, how do I get to…?", "Is it far?", "So I turn left at…?", "Thank you so much."],
    null, 6,
    [["Excuse me, how do I get to the museum?", "Go straight two blocks."], ["Is it far?", "About 10 minutes."], ["So I turn left at the bank?", "Yes. Thank you so much.", "You're welcome."]]),
  m("shopping-return", "Đổi trả hàng", "Return a purchase", "life", "A2", ["All"],
    "Bạn đổi một chiếc áo không vừa (nhân viên người Úc). Giải thích và hỏi chính sách đổi trả.",
    { name: "Amy", role: "Shop Assistant", personality: "Lịch sự, giúp đỡ", accent_hint: "Australian", speaking_speed: "normal" },
    [["Nêu vấn đề", "Did the learner state the issue?"], ["Hỏi chính sách", "Did the learner ask about the policy?"], ["Chốt", "Did the learner resolve it?"]],
    ["I'd like to return…", "It doesn't fit.", "What's your return policy?", "Could I exchange it?"],
    "clarify", 6,
    [["I'd like to return this shirt, it doesn't fit.", "Do you have the receipt?", "What's your return policy?", "You can exchange within 14 days."], ["Could I exchange it for a larger size?", "Of course."]]),
  m("doctor-symptoms", "Mô tả triệu chứng", "Describe symptoms to a doctor", "life", "B1", ["All"],
    "Bạn khám bệnh (bác sĩ người Mỹ). Mô tả triệu chứng, thời gian và mức độ.",
    { name: "Dr. Lee", role: "Doctor", personality: "Điềm tĩnh, hỏi kỹ", accent_hint: "American", speaking_speed: "normal" },
    [["Mô tả", "Did the learner describe symptoms?"], ["Thời gian", "Did the learner say how long?"], ["Mức độ", "Did the learner rate severity?"]],
    ["I've been experiencing…", "It started…", "It hurts when…", "On a scale of one to ten…"],
    "bluf", 8,
    [["I've been experiencing headaches.", "How long?", "It started three days ago."], ["It hurts when I look at screens.", "On a scale of one to ten?", "About a six."], ["Let's run some tests.", "Okay."]]),
  m("apartment-complaint", "Khiếu nại nhà thuê", "Report an apartment issue", "life", "B1", ["All"],
    "Bạn báo chủ nhà (người Úc) về vòi nước bị rò. Mô tả và đề nghị sửa.",
    { name: "Rob", role: "Landlord", personality: "Bận rộn, lịch sự", accent_hint: "Australian", speaking_speed: "normal" },
    [["Mô tả", "Did the learner describe the issue?"], ["Thời gian", "Did the learner say since when?"], ["Đề nghị", "Did the learner request a fix?"]],
    ["There's a problem with…", "It started…", "Could you send someone…?", "When can it be fixed?"],
    "bad-news", 8,
    [["There's a problem with the kitchen tap.", "What's wrong?", "It started leaking yesterday."], ["Could you send someone to fix it?", "When can it be fixed?", "Tomorrow morning works."]]),
  m("presentation-qna", "Hỏi đáp sau thuyết trình", "Q&A after a presentation", "work", "B2", ["BA", "PM", "All"],
    "Bạn trả lời câu hỏi khó sau thuyết trình (khán giả người Mỹ). Giữ bình tĩnh và trả lời trúng.",
    { name: "Carol", role: "Attendee", personality: "Thách thức, thẳng thắn", accent_hint: "American", speaking_speed: "normal" },
    [["Nghe câu hỏi", "Did the learner listen and clarify?"], ["Trả lời", "Did the learner answer directly?"], ["Chuyển hướng", "Did the learner handle pushback?"]],
    ["That's a great question.", "Let me clarify…", "I see your point, but…", "To summarise my answer…"],
    "repair", 10,
    [["That's a great question. Let me clarify the cost.", "Okay."], ["I see your point, but the data shows otherwise.", "Can you elaborate?"], ["To summarise my answer, the ROI is positive.", "Fair enough."]]),
  m("cross-team-sync", "Đồng bộ liên team", "Cross-team sync", "work", "B2", ["BA", "PM", "Dev", "All"],
    "Bạn đồng bộ tiến độ với team khác (lead người Ấn Độ). Chia sẻ phụ thuộc và rủi ro chung.",
    { name: "Arjun", role: "Other Team Lead", personality: "Hợp tác, trực tiếp", accent_hint: "Indian", speaking_speed: "normal" },
    [["Chia sẻ", "Did the learner share progress?"], ["Nêu phụ thuộc", "Did the learner mention dependencies?"], ["Thống nhất", "Did the learner agree next steps?"]],
    ["Here's where we are…", "We depend on…", "Could you…?", "Let's align on…"],
    "hand-off", 8,
    [["Here's where we are with the API.", "We depend on your auth module.", "Could you deliver it by Friday?", "Let's align on that.", "Agreed."]]),
];

function main() {
  const mPath = join(process.cwd(), "data", "missions.json");
  const fPath = join(process.cwd(), "data", "fluency-prompts.json");
  const missions = JSON.parse(readFileSync(mPath, "utf-8")) as Mission[];
  const fluency = JSON.parse(readFileSync(fPath, "utf-8")) as Array<{
    id: string;
    kind: string;
    prompt_en: string;
    prompt_vi: string;
    level: string;
    topic: string;
  }>;

  const existingMissionIds = new Set(missions.map((x) => x.id));
  const allCandidates = [...NEW_MISSIONS, ...MORE_MISSIONS];
  const addedMissions = allCandidates.filter((x) => !existingMissionIds.has(x.id));
  const allMissions = [...missions, ...addedMissions];

  console.log(`missions: ${missions.length} -> ${allMissions.length} (added ${addedMissions.length})`);
  for (const mm of allMissions) {
    if (!mm.id || mm.objectives.length < 2) {
      console.error(`BAD mission ${mm.id}`);
      process.exit(1);
    }
  }

  // ---- Fluency: expand to 300 ----
  const kinds = ["one_minute", "eli5", "picture", "quick_fire", "story_chain"];

  // Curated base prompts per kind (distinct, meaningful)
  const BASE: Record<string, [string, string, string][]> = {
    // [prompt_en, prompt_vi, topic]
    one_minute: [
      ["Describe your typical workday from morning to evening.", "Mô tả một ngày làm việc điển hình của bạn từ sáng đến tối.", "work"],
      ["Explain a project you are proud of.", "Giải thích một dự án bạn tự hào.", "work"],
      ["Talk about a challenge you faced and how you solved it.", "Nói về một thử thách bạn đã gặp và cách giải quyết.", "work"],
      ["Describe your ideal job and why.", "Mô tả công việc mơ ước và lý do.", "work"],
      ["Talk about how you prepare for an important meeting.", "Nói về cách bạn chuẩn bị cho một cuộc họp quan trọng.", "work"],
      ["Describe your morning routine in detail.", "Mô tả chi tiết thói quen buổi sáng của bạn.", "life"],
      ["Talk about a hobby you enjoy and why you like it.", "Nói về một sở thích và lý do bạn thích.", "life"],
      ["Describe your family and what you like doing together.", "Mô tả gia đình và những gì bạn thích làm cùng nhau.", "family"],
      ["Talk about a place you visited recently.", "Nói về một nơi bạn vừa đến thăm.", "travel"],
      ["Describe how you plan a trip.", "Mô tả cách bạn lên kế hoạch cho một chuyến đi.", "travel"],
      ["Explain why you chose your field of study.", "Giải thích lý do bạn chọn ngành học.", "study"],
      ["Talk about a book or article that influenced you.", "Nói về một cuốn sách hoặc bài viết ảnh hưởng đến bạn.", "study"],
      ["Describe how you use technology in daily life.", "Mô tả cách bạn dùng công nghệ trong đời sống.", "tech"],
      ["Talk about a piece of technology you cannot live without.", "Nói về một thiết bị công nghệ bạn không thể thiếu.", "tech"],
      ["Describe your favourite dish and how it is made.", "Mô tả món ăn yêu thích và cách chế biến.", "food"],
      ["Talk about a healthy habit you are trying to build.", "Nói về một thói quen lành mạnh bạn đang xây dựng.", "health"],
      ["Describe how you manage your money each month.", "Mô tả cách bạn quản lý tiền bạc hằng tháng.", "money"],
      ["Talk about something you do to protect the environment.", "Nói về điều bạn làm để bảo vệ môi trường.", "environment"],
      ["Describe a tradition that matters to you.", "Mô tả một truyền thống quan trọng với bạn.", "culture"],
      ["Talk about your best friend and how you met.", "Nói về người bạn thân và cách bạn gặp nhau.", "friends"],
      ["Describe how you handle stress at work.", "Mô tả cách bạn xử lý căng thẳng trong công việc.", "work"],
      ["Talk about a skill you want to learn next.", "Nói về một kỹ năng bạn muốn học tiếp theo.", "study"],
      ["Describe a meal you cooked recently.", "Mô tả một bữa ăn bạn vừa nấu.", "food"],
      ["Talk about how you stay active during the week.", "Nói về cách bạn vận động trong tuần.", "health"],
      ["Describe your favourite place to relax.", "Mô tả nơi yêu thích để thư giãn của bạn.", "life"],
      ["Talk about a goal you set for this year.", "Nói về một mục tiêu bạn đặt ra năm nay.", "life"],
      ["Describe how you commute to work.", "Mô tả cách bạn đi làm.", "work"],
      ["Talk about a piece of advice that stuck with you.", "Nói về một lời khuyên bạn còn nhớ.", "friends"],
      ["Describe a festival you celebrate.", "Mô tả một lễ hội bạn tham gia.", "culture"],
      ["Talk about how you save time in a busy day.", "Nói về cách bạn tiết kiệm thời gian trong ngày bận.", "work"],
      ["Describe a gadget you recently bought.", "Mô tả một thiết bị bạn vừa mua.", "tech"],
      ["Talk about a place in your city you recommend.", "Nói về một địa điểm trong thành phố bạn muốn giới thiệu.", "travel"],
      ["Describe how you keep your workspace tidy.", "Mô tả cách bạn giữ nơi làm việc gọn gàng.", "work"],
      ["Talk about a recent success at work or study.", "Nói về một thành công gần đây trong công việc hoặc học tập.", "work"],
      ["Describe how you celebrate a personal milestone.", "Mô tả cách bạn ăn mừng một cột mốc cá nhân.", "life"],
      ["Talk about a piece of news that made you think.", "Nói về một tin tức khiến bạn suy nghĩ.", "culture"],
    ],
    eli5: [
      ["Explain how the internet works to a child.", "Giải thích internet hoạt động thế nào cho một đứa trẻ.", "tech"],
      ["Explain what a budget is to a child.", "Giải thích ngân sách là gì cho một đứa trẻ.", "money"],
      ["Explain why we need to sleep to a child.", "Giải thích vì sao cần ngủ cho một đứa trẻ.", "health"],
      ["Explain how plants grow to a child.", "Giải thích cây lớn lên thế nào cho một đứa trẻ.", "environment"],
      ["Explain what a meeting is to a child.", "Giải thích cuộc họp là gì cho một đứa trẻ.", "work"],
      ["Explain how a library works to a child.", "Giải thích thư viện hoạt động thế nào cho một đứa trẻ.", "study"],
      ["Explain why exercise is good to a child.", "Giải thích vì sao tập thể dục tốt cho một đứa trẻ.", "health"],
      ["Explain how music is made to a child.", "Giải thích âm nhạc được tạo ra thế nào cho một đứa trẻ.", "culture"],
      ["Explain what a recipe is to a child.", "Giải thích công thức nấu ăn là gì cho một đứa trẻ.", "food"],
      ["Explain how a phone sends a message to a child.", "Giải thích điện thoại gửi tin nhắn thế nào cho một đứa trẻ.", "tech"],
      ["Explain why we save water to a child.", "Giải thích vì sao cần tiết kiệm nước cho một đứa trẻ.", "environment"],
      ["Explain what a deadline is to a child.", "Giải thích deadline là gì cho một đứa trẻ.", "work"],
      ["Explain how a plane flies to a child.", "Giải thích máy bay bay thế nào cho một đứa trẻ.", "travel"],
      ["Explain why we brush our teeth to a child.", "Giải thích vì sao cần đánh răng cho một đứa trẻ.", "health"],
    ],
    picture: [
      ["Describe a crowded market you can imagine.", "Mô tả một khu chợ đông đúc bạn hình dung.", "life"],
      ["Describe a busy train station scene.", "Mô tả cảnh một nhà ga đông đúc.", "travel"],
      ["Describe a family having dinner together.", "Mô tả một gia đình đang ăn tối.", "family"],
      ["Describe an office in the middle of a deadline.", "Mô tả một văn phòng giữa mùa deadline.", "work"],
      ["Describe a quiet library in the afternoon.", "Mô tả một thư viện yên tĩnh buổi chiều.", "study"],
      ["Describe a street food stall at night.", "Mô tả một xe đồ ăn đường phố ban đêm.", "food"],
      ["Describe a park in early morning.", "Mô tả một công viên vào sáng sớm.", "environment"],
      ["Describe a hospital waiting room.", "Mô tả phòng chờ bệnh viện.", "health"],
      ["Describe a classroom during an exam.", "Mô tả một lớp học trong giờ thi.", "study"],
      ["Describe a beach at sunset.", "Mô tả bãi biển lúc hoàng hôn.", "travel"],
      ["Describe a supermarket on a weekend.", "Mô tả một siêu thị cuối tuần.", "life"],
      ["Describe a rainy street with umbrellas.", "Mô tả một con phố mưa với những chiếc ô.", "environment"],
      ["Describe a birthday party surprise.", "Mô tả một bữa tiệc sinh nhật bất ngờ.", "family"],
      ["Describe a co-working space in the morning.", "Mô tả một không gian làm việc chung buổi sáng.", "work"],
    ],
    quick_fire: [
      ["Coffee or tea? Why?", "Cà phê hay trà? Vì sao?", "food"],
      ["Early bird or night owl? Why?", "Người dậy sớm hay cú đêm? Vì sao?", "life"],
      ["Work from home or office? Why?", "Làm ở nhà hay ở công ty? Vì sao?", "work"],
      ["Books or movies? Why?", "Sách hay phim? Vì sao?", "culture"],
      ["City or countryside? Why?", "Thành phố hay nông thôn? Vì sao?", "travel"],
      ["Save money or spend it? Why?", "Tiết kiệm hay tiêu tiền? Vì sao?", "money"],
      ["Plan ahead or go with the flow? Why?", "Lập kế hoạch hay tuỳ cơ? Vì sao?", "life"],
      ["Team sports or solo exercise? Why?", "Thể thao đồng đội hay tập một mình? Vì sao?", "health"],
      ["Learn online or in a class? Why?", "Học online hay học ở lớp? Vì sao?", "study"],
      ["Call or text? Why?", "Gọi điện hay nhắn tin? Vì sao?", "friends"],
      ["Cook at home or eat out? Why?", "Nấu ở nhà hay ăn ngoài? Vì sao?", "food"],
      ["Summer or winter? Why?", "Mùa hè hay mùa đông? Vì sao?", "environment"],
      ["Study alone or in a group? Why?", "Học một mình hay theo nhóm? Vì sao?", "study"],
      ["Big city or small town? Why?", "Thành phố lớn hay thị trấn nhỏ? Vì sao?", "travel"],
    ],
    story_chain: [
      ["Tell a short story that starts with a lost phone.", "Kể một truyện ngắn bắt đầu bằng một chiếc điện thoại bị mất.", "life"],
      ["Tell a story about a surprising job interview.", "Kể truyện về một buổi phỏng vấn bất ngờ.", "work"],
      ["Tell a story about missing a flight.", "Kể truyện về việc lỡ chuyến bay.", "travel"],
      ["Tell a story about a misunderstanding with a friend.", "Kể truyện về một hiểu lầm với bạn bè.", "friends"],
      ["Tell a story about a strange recipe.", "Kể truyện về một công thức nấu ăn kỳ lạ.", "food"],
      ["Tell a story about getting lost in a new city.", "Kể truyện về việc bị lạc ở thành phố mới.", "travel"],
      ["Tell a story about a first day at a new job.", "Kể truyện về ngày đầu ở công ty mới.", "work"],
      ["Tell a story about an unexpected act of kindness.", "Kể truyện về một hành động tử tế bất ngờ.", "life"],
      ["Tell a story about a power cut during a storm.", "Kể truyện về mất điện giữa bão.", "environment"],
      ["Tell a story about learning to cook from a grandparent.", "Kể truyện về việc học nấu ăn từ ông bà.", "family"],
      ["Tell a story about a delayed train.", "Kể truyện về một chuyến tàu bị trễ.", "travel"],
      ["Tell a story about a funny email typo.", "Kể truyện về một lỗi gõ email hài hước.", "work"],
      ["Tell a story about finding an old diary.", "Kể truyện về việc tìm thấy một cuốn nhật ký cũ.", "life"],
      ["Tell a story about a neighbourhood street party.", "Kể truyện về một bữa tiệc đường phố khu phố.", "culture"],
    ],
  };

  const existingFluencyIds = new Set(fluency.map((x) => x.id));
  const newFluency: typeof fluency = [];
  let counter = fluency.length;
  const levels = ["A2", "B1", "B2"];

  // Expand base prompts across levels/topics to reach 300
  const kindOrder = kinds;
  for (const kind of kindOrder) {
    const bases = BASE[kind] ?? [];
    for (let li = 0; li < bases.length; li++) {
      const [pen, pvi, topic] = bases[li];
      for (const level of levels) {
        counter++;
        const id = `ftp-${String(counter).padStart(2, "0")}`;
        if (existingFluencyIds.has(id)) continue;
        newFluency.push({ id, kind, prompt_en: pen, prompt_vi: pvi, level, topic });
        if (fluency.length + newFluency.length >= 300) break;
      }
      if (fluency.length + newFluency.length >= 300) break;
    }
    if (fluency.length + newFluency.length >= 300) break;
  }

  const allFluency = [...fluency, ...newFluency];
  console.log(`fluency: ${fluency.length} -> ${allFluency.length} (added ${newFluency.length})`);

  writeFileSync(mPath, JSON.stringify(allMissions, null, 2) + "\n", "utf-8");
  writeFileSync(fPath, JSON.stringify(allFluency, null, 2) + "\n", "utf-8");

  if (allMissions.length < 60) {
    console.error(`FAIL missions ${allMissions.length} < 60`);
    process.exit(1);
  }
  if (allFluency.length < 300) {
    console.error(`FAIL fluency ${allFluency.length} < 300`);
    process.exit(1);
  }
  console.log("OK");
}

main();
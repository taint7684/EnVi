export type WritingLevel = "A2" | "B1" | "B2";

export type WritingPrompt = {
  id: string;
  level: WritingLevel;
  category: "daily" | "it-ba";
  title: string;
  situation_vi: string;
  instruction_en: string;
  minWords: number;
  sampleAnswer: string;
  checklist: string[];
};

export const WRITING_PROMPTS: WritingPrompt[] = [
  {
    id: "a2-email-meeting",
    level: "A2",
    category: "it-ba",
    title: "Email đặt lịch họp",
    situation_vi:
      "Bạn cần gửi email cho đồng nghiệp để đặt lịch họp vào tuần sau.",
    instruction_en:
      "Write a short email (40-60 words) to arrange a meeting next week. Say when you are free and ask when they are available.",
    minWords: 40,
    sampleAnswer:
      "Hi Anna,\n\nI would like to set up a short meeting next week to discuss the new project. I am free on Tuesday and Thursday afternoon. When are you available?\n\nThanks,\nMinh",
    checklist: [
      "Có lời chào đầu email",
      "Nêu rõ mục đích (đặt lịch họp)",
      "Đề xuất thời gian cụ thể",
      "Hỏi lịch của người nhận",
      "Có lời cảm ơn / ký tên",
    ],
  },
  {
    id: "a2-progress-update",
    level: "A2",
    category: "it-ba",
    title: "Cập nhật tiến độ ngắn",
    situation_vi:
      "Bạn báo cáo ngắn cho quản lý về việc bạn đã làm hôm nay.",
    instruction_en:
      "Write a short progress update (40-60 words) to your manager. Say what you finished today and what you will do tomorrow.",
    minWords: 40,
    sampleAnswer:
      "Hi David,\n\nToday I finished the login page and fixed two small bugs. Tomorrow I will start the dashboard and review the design. Everything is on track.\n\nBest,\nMinh",
    checklist: [
      "Có lời chào",
      "Nêu việc đã hoàn thành hôm nay",
      "Nêu việc sẽ làm ngày mai",
      "Trạng thái (on track / blocked)",
      "Có ký tên",
    ],
  },
  {
    id: "a2-ask-requirement",
    level: "A2",
    category: "it-ba",
    title: "Hỏi rõ yêu cầu",
    situation_vi:
      "Bạn nhận một yêu cầu từ BA nhưng chưa rõ, cần hỏi lại.",
    instruction_en:
      "Write a short message (40-60 words) to ask for clarification about a requirement you do not fully understand.",
    minWords: 40,
    sampleAnswer:
      "Hi Lan,\n\nThanks for the requirement document. I have one question: should the report include last month's data or this month's? Could you confirm so I can estimate correctly?\n\nThanks,\nMinh",
    checklist: [
      "Cảm ơn / xác nhận đã nhận",
      "Nêu rõ phần chưa hiểu",
      "Đặt câu hỏi cụ thể",
      "Lý do cần làm rõ",
      "Kết thúc lịch sự",
    ],
  },
  {
    id: "a2-report-bug",
    level: "A2",
    category: "it-ba",
    title: "Báo lỗi",
    situation_vi:
      "Bạn phát hiện lỗi trên production và cần báo cho team.",
    instruction_en:
      "Write a short bug report (40-60 words). Say what happened, when it started, and how serious it is.",
    minWords: 40,
    sampleAnswer:
      "Hi team,\n\nI found a bug on production: the export button returns a 500 error. It started about 30 minutes ago and affects all users. Can someone check the logs?\n\nThanks,\nMinh",
    checklist: [
      "Mô tả lỗi là gì",
      "Thời điểm bắt đầu",
      "Mức độ ảnh hưởng",
      "Yêu cầu hành động",
      "Ký tên",
    ],
  },
  {
    id: "a2-meeting-summary",
    level: "A2",
    category: "it-ba",
    title: "Tóm tắt cuộc họp",
    situation_vi:
      "Bạn vừa họp xong và cần gửi tóm tắt cho team.",
    instruction_en:
      "Write a short meeting summary (40-60 words). List 2-3 decisions and the next action.",
    minWords: 40,
    sampleAnswer:
      "Hi all,\n\nQuick summary of today's meeting:\n- We decided to launch on Friday.\n- Anna will update the design by Wednesday.\n- I will finish the API by Thursday.\n\nThanks,\nMinh",
    checklist: [
      "Có tiêu đề / lời chào",
      "Ít nhất 2 quyết định",
      "Có action + người phụ trách",
      "Có thời hạn (deadline)",
      "Ký tên",
    ],
  },
  {
    id: "a2-daily-intro",
    level: "A2",
    category: "daily",
    title: "Giới thiệu bản thân",
    situation_vi:
      "Bạn giới thiệu bản thân cho đồng nghiệp mới.",
    instruction_en:
      "Write a short self-introduction (40-60 words) for a new colleague. Say your name, role, and one thing you like about your job.",
    minWords: 40,
    sampleAnswer:
      "Hi everyone,\n\nMy name is Minh and I am a business analyst. I have been working here for two years. I like my job because I get to talk to many different people and solve problems.\n\nNice to meet you!",
    checklist: [
      "Tên",
      "Vai trò / công việc",
      "Một điều thích về công việc",
      "Lời chào thân thiện",
    ],
  },
  {
    id: "b1-email-stakeholder",
    level: "B1",
    category: "it-ba",
    title: "Email cập nhật cho stakeholder",
    situation_vi:
      "Bạn cập nhật tiến độ dự án cho một stakeholder quan trọng.",
    instruction_en:
      "Write an email (80-100 words) to update a stakeholder on the project. Mention progress, risks, and next steps.",
    minWords: 80,
    sampleAnswer:
      "Dear Mr. Brown,\n\nI am writing to update you on the CRM project. The development phase is 70% complete and we are on schedule. However, we have identified a risk with the data migration, which may take two extra days. To mitigate this, we have added a senior developer to the team. Next week we will start user acceptance testing.\n\nPlease let me know if you have any questions.\n\nBest regards,\nMinh",
    checklist: [
      "Lời chào trang trọng",
      "Tỷ lệ hoàn thành / tiến độ",
      "Nêu rủi ro cụ thể",
      "Biện pháp giảm thiểu",
      "Bước tiếp theo + thời hạn",
      "Kết thúc chuyên nghiệp",
    ],
  },
  {
    id: "b1-clarify-scope",
    level: "B1",
    category: "it-ba",
    title: "Làm rõ phạm vi",
    situation_vi:
      "Client yêu cầu thêm tính năng ngoài phạm vi hợp đồng.",
    instruction_en:
      "Write a message (80-100 words) to clarify the scope with the client. Explain what is included and what would be a change request.",
    minWords: 80,
    sampleAnswer:
      "Dear Ms. Hoa,\n\nThank you for your feedback on the proposal. I would like to clarify the scope. The current agreement covers the three modules we discussed in the initial meeting: user management, reporting, and notifications. The additional dashboard you mentioned is not included in the current scope. We would be happy to add it as a change request, which would require two additional weeks and an adjusted budget. Could we schedule a call to discuss this?\n\nBest regards,\nMinh",
    checklist: [
      "Cảm ơn phản hồi",
      "Nêu rõ phạm vi hiện tại",
      "Phân biệt in-scope vs change request",
      "Đề xuất phương án (call / change request)",
      "Giữ thái độ hợp tác",
    ],
  },
  {
    id: "b1-incident-report",
    level: "B1",
    category: "it-ba",
    title: "Báo cáo sự cố",
    situation_vi:
      "Bạn viết báo cáo sự cố sau khi hệ thống downtime 1 giờ.",
    instruction_en:
      "Write an incident report (80-100 words). Describe what happened, the impact, the root cause, and how to prevent it.",
    minWords: 80,
    sampleAnswer:
      "Incident Report — 2026-11-20\n\nSummary: The payment service was unavailable for 58 minutes between 14:02 and 15:00 ICT.\n\nImpact: Approximately 320 users were unable to complete checkout. No data was lost.\n\nRoot cause: A database connection pool exhausted after a traffic spike.\n\nResolution: We restarted the service and increased the pool size.\n\nPrevention: Add monitoring alerts for pool usage and implement auto-scaling.\n\nOwner: Minh Nguyen",
    checklist: [
      "Thời gian + thời lượng",
      "Mô tả impact (số user / doanh thu)",
      "Root cause rõ ràng",
      "Cách khắc phục",
      "Biện pháp phòng ngừa",
      "Người phụ trách",
    ],
  },
  {
    id: "b1-meeting-agenda",
    level: "B1",
    category: "it-ba",
    title: "Agenda họp",
    situation_vi:
      "Bạn chuẩn bị agenda cho cuộc họp sprint planning.",
    instruction_en:
      "Write a meeting agenda (80-100 words) for a sprint planning meeting. Include at least 3 topics and time allocations.",
    minWords: 80,
    sampleAnswer:
      "Sprint Planning — Agenda\n\nDate: 25 Nov 2026, 10:00–11:00\nAttendees: Dev team, BA, Scrum Master\n\n1. Review last sprint (10 min) — what went well, what to improve.\n2. Backlog refinement (20 min) — clarify top 5 stories and acceptance criteria.\n3. Sprint goal and commitment (15 min) — agree on scope and capacity.\n4. Action items (10 min) — assign owners and deadlines.\n\nPlease read the backlog before the meeting.",
    checklist: [
      "Ngày / giờ / người tham dự",
      "Ít nhất 3 chủ đề",
      "Phân bổ thời gian mỗi mục",
      "Mục tiêu sprint",
      "Yêu cầu chuẩn bị trước",
    ],
  },
  {
    id: "b1-daily-weekend",
    level: "B1",
    category: "daily",
    title: "Kể về cuối tuần",
    situation_vi:
      "Bạn kể cho đồng nghiệp về cuối tuần của bạn.",
    instruction_en:
      "Write a short paragraph (80-100 words) about your weekend. Use at least two past tense verbs and one linking word.",
    minWords: 80,
    sampleAnswer:
      "Last weekend was quite relaxing. On Saturday morning, I went to a coffee shop with two friends and we talked about our plans for the holidays. In the afternoon, I finished reading a book that I had started last month. On Sunday, I stayed at home and cooked a new recipe, although it did not turn out as well as I expected. Overall, it was a quiet but enjoyable weekend.",
    checklist: [
      "Ít nhất 2 động từ quá khứ",
      "Một linking word (although, however, ...)",
      "Chi tiết cụ thể (địa điểm / hoạt động)",
      "Kết luận / cảm nhận",
    ],
  },
  {
    id: "b1-opinion-remote",
    level: "B1",
    category: "daily",
    title: "Ý kiến về remote work",
    situation_vi:
      "Bạn viết ý kiến về làm việc từ xa.",
    instruction_en:
      "Write a short opinion paragraph (80-100 words) about remote work. Give one advantage and one disadvantage.",
    minWords: 80,
    sampleAnswer:
      "In my opinion, remote work has both benefits and drawbacks. The main advantage is that it saves time and money on commuting, which allows people to have a better work-life balance. However, one disadvantage is that it can be harder to communicate with team members, especially for new employees who need guidance. Overall, I think a hybrid model, where people work from home two or three days a week, would be the best solution for most companies.",
    checklist: [
      "Nêu rõ quan điểm",
      "Ít nhất 1 advantage + 1 disadvantage",
      "Linking word (however, although, ...)",
      "Kết luận / đề xuất",
    ],
  },
  {
    id: "b2-email-negotiation",
    level: "B2",
    category: "it-ba",
    title: "Email đàm phán deadline",
    situation_vi:
      "Bạn cần đàm phán gia hạn deadline với client.",
    instruction_en:
      "Write an email (120-150 words) to negotiate a deadline extension with a client. Justify the request and propose a new date.",
    minWords: 120,
    sampleAnswer:
      "Dear Ms. Hoa,\n\nI am writing to request a two-week extension for the reporting module, moving the delivery date from 30 November to 14 December.\n\nThe reason for this request is that during integration testing we discovered a data inconsistency in the legacy system that was not visible in the initial analysis. Resolving this properly requires additional validation work that was not in the original estimate. If we proceed without this fix, there is a significant risk of inaccurate reports, which would affect the finance team's month-end closing.\n\nTo minimise the impact, I propose we deliver the user management module on the original date as planned, and only the reporting module would move to 14 December. I am happy to discuss this on a call at your convenience.\n\nThank you for your understanding.\n\nBest regards,\nMinh Nguyen",
    checklist: [
      "Nêu rõ yêu cầu + lý do kỹ thuật",
      "Giải thích rủi ro nếu không gia hạn",
      "Đề xuất phương án giảm thiểu (partial delivery)",
      "Đề xuất call / meeting",
      "Giọng điệu chuyên nghiệp, không xin lỗi quá mức",
    ],
  },
  {
    id: "b2-requirements-tradeoff",
    level: "B2",
    category: "it-ba",
    title: "Phân tích trade-off yêu cầu",
    situation_vi:
      "Bạn phân tích trade-off giữa hai phương án cho một tính năng.",
    instruction_en:
      "Write an analysis (120-150 words) comparing two approaches to a feature. State your recommendation with justification.",
    minWords: 120,
    sampleAnswer:
      "We need to decide between two approaches for the search feature: client-side filtering or a server-side search API.\n\nOption A, client-side filtering, is faster to implement and requires no backend changes. However, it will not scale beyond a few hundred records and increases the initial page load size.\n\nOption B, a server-side search API, requires more upfront work — approximately three additional days — but it scales to millions of records and enables features like full-text search and relevance ranking.\n\nGiven that the dataset is expected to grow to over 50,000 records within six months, I recommend Option B despite the higher initial cost. The long-term maintainability and scalability benefits outweigh the short-term delay.\n\nI have documented the detailed comparison in the attached document and would appreciate your feedback.",
    checklist: [
      "Nêu rõ 2 phương án",
      "Trade-off cụ thể (cost vs scalability)",
      "Khuyến nghị rõ ràng + lý do",
      "Dữ liệu / bằng chứng hỗ trợ",
      "Kết thúc mở cho feedback",
    ],
  },
  {
    id: "b2-stakeholder-alignment",
    level: "B2",
    category: "it-ba",
    title: "Align stakeholder xung đột",
    situation_vi:
      "Hai stakeholder có yêu cầu mâu thuẫn, bạn cần align.",
    instruction_en:
      "Write an email (120-150 words) to align two stakeholders with conflicting requirements. Propose a compromise.",
    minWords: 120,
    sampleAnswer:
      "Dear Anna and David,\n\nThank you both for your input on the notification feature. I understand that Anna's team needs real-time alerts for urgent issues, while David's team prefers a daily digest to avoid notification fatigue.\n\nAfter reviewing both use cases, I propose a tiered approach: critical alerts (severity 1) will be sent immediately via push notification and email, while non-critical updates will be grouped into a daily digest sent at 8:00 AM. Users will be able to customise their preferences in settings.\n\nThis approach addresses Anna's need for timely escalation and David's concern about noise. I have attached a draft of the notification matrix for your review.\n\nCould we schedule 30 minutes on Thursday to finalise this? I want to ensure both teams are aligned before we begin implementation.\n\nBest regards,\nMinh",
    checklist: [
      "Tóm tắt mâu thuẫn của cả hai bên",
      "Đề xuất compromise cụ thể",
      "Giải thích lợi ích cho mỗi bên",
      "Kèm bằng chứng / draft",
      "Đề xuất meeting để chốt",
    ],
  },
  {
    id: "b2-summary-decision",
    level: "B2",
    category: "daily",
    title: "Tóm tắt quyết định phức tạp",
    situation_vi:
      "Bạn tóm tắt một quyết định kỹ thuật phức tạp cho người không kỹ thuật.",
    instruction_en:
      "Write a summary (120-150 words) explaining a technical decision to a non-technical audience. Use an analogy.",
    minWords: 120,
    sampleAnswer:
      "Last week we decided to migrate our database from a single server to a distributed cluster. I understand this may sound technical, so let me explain with an analogy.\n\nThink of our current database as a single cashier at a supermarket. When many customers arrive at once, the queue gets long and everyone waits. A distributed cluster is like opening five checkout counters — customers spread out and the wait time drops dramatically.\n\nThe trade-off is cost and complexity. Running five counters requires more staff training and coordination. Similarly, a distributed cluster requires more engineering effort to maintain and monitor.\n\nWe expect this change to reduce page load times by 40% during peak hours and eliminate the outages we experienced last quarter. The migration will happen gradually over the next two weeks, with no downtime for users.\n\nI am happy to answer any questions.",
    checklist: [
      "Dùng analogy dễ hiểu",
      "Trade-off (cost vs benefit)",
      "Lợi ích cụ thể (số liệu)",
      "Kế hoạch migration + downtime",
      "Mời đặt câu hỏi",
    ],
  },
  {
    id: "b2-presentation-script",
    level: "B2",
    category: "daily",
    title: "Kịch bản thuyết trình ngắn",
    situation_vi:
      "Bạn viết kịch bản cho phần giới thiệu trong cuộc họp.",
    instruction_en:
      "Write a short presentation script (120-150 words) to open a project review meeting. Set the context and state the objective.",
    minWords: 120,
    sampleAnswer:
      "Good morning, everyone. Thank you for joining today's project review.\n\nAs you know, we are now at the midpoint of the Q4 roadmap, and I would like to take the next 30 minutes to review where we stand against our original goals, discuss two risks that have emerged, and agree on priorities for the next sprint.\n\nBefore we dive in, I want to remind us of the objective: to deliver a stable reporting module that the finance team can rely on for month-end closing. That remains our north star.\n\nI will start with a brief status update, then Anna will walk us through the design changes, and we will finish with an open discussion.\n\nPlease feel free to interrupt with questions at any point. Let's begin.",
    checklist: [
      "Lời chào + cảm ơn",
      "Bối cảnh (midpoint / Q4)",
      "Mục tiêu cuộc họp + agenda",
      "Nhắc lại objective chính",
      "Mời đặt câu hỏi",
    ],
  },
];

export const WRITING_LEVEL_LABELS: Record<WritingLevel, string> = {
  A2: "A2 — Cơ bản",
  B1: "B1 — Trung cấp",
  B2: "B2 — Trung cấp nâng cao",
};

export function getWritingPrompts(
  level: WritingLevel,
  category?: "daily" | "it-ba",
): WritingPrompt[] {
  return WRITING_PROMPTS.filter(
    (p) => p.level === level && (category === undefined || p.category === category),
  );
}

export function getWritingPrompt(id: string): WritingPrompt | undefined {
  return WRITING_PROMPTS.find((p) => p.id === id);
}

export const WRITING_CHECKLIST_ITEMS = [
  "Mở đầu / lời chào phù hợp",
  "Nêu rõ mục đích",
  "Ngữ pháp đúng",
  "Từ vựng phù hợp trình độ",
  "Kết thúc rõ ràng",
];
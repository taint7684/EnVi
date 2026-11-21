import { WritingHome } from "@/components/writing/writing-home";
import { getWritingUserId, listWritingDrafts } from "@/app/actions/writing";

export default async function WritingPage() {
  const [drafts, userId] = await Promise.all([
    listWritingDrafts(),
    getWritingUserId(),
  ]);
  return <WritingHome drafts={drafts} userId={userId ?? ""} />;
}
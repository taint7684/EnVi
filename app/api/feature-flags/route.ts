import { getFeatureFlags } from "@/lib/feature-flags";

export async function GET() {
  const flags = await getFeatureFlags();
  return Response.json({ flags });
}
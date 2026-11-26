"use server";

import { createClient } from "@/lib/supabase/server";
import {
  type FeatureFlag,
  FEATURE_FLAG_DEFAULTS,
} from "@/lib/feature-flags-types";

let cachedFlags: Record<FeatureFlag, boolean> | null = null;

export async function getFeatureFlags(): Promise<Record<FeatureFlag, boolean>> {
  if (cachedFlags) return cachedFlags;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    cachedFlags = { ...FEATURE_FLAG_DEFAULTS };
    return cachedFlags;
  }

  const { data } = await supabase
    .from("app_settings")
    .select("feature_flags")
    .eq("user_id", user.id)
    .maybeSingle();

  if (data?.feature_flags) {
    cachedFlags = { ...FEATURE_FLAG_DEFAULTS, ...data.feature_flags } as Record<FeatureFlag, boolean>;
  } else {
    cachedFlags = { ...FEATURE_FLAG_DEFAULTS };
  }

  return cachedFlags;
}

export async function getFeatureFlag(flag: FeatureFlag): Promise<boolean> {
  const flags = await getFeatureFlags();
  return flags[flag] ?? FEATURE_FLAG_DEFAULTS[flag];
}

export async function setFeatureFlag(flag: FeatureFlag, enabled: boolean): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const flags = await getFeatureFlags();
  flags[flag] = enabled;

  await supabase
    .from("app_settings")
    .upsert({
      user_id: user.id,
      feature_flags: flags,
      updated_at: new Date().toISOString(),
    });

  cachedFlags = flags;
}

export async function setFeatureFlags(flags: Partial<Record<FeatureFlag, boolean>>): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const currentFlags = await getFeatureFlags();
  const newFlags = { ...currentFlags, ...flags };

  await supabase
    .from("app_settings")
    .upsert({
      user_id: user.id,
      feature_flags: newFlags,
      updated_at: new Date().toISOString(),
    });

  cachedFlags = newFlags as Record<FeatureFlag, boolean>;
}

export async function clearFeatureFlagsCache(): Promise<void> {
  cachedFlags = null;
}
"use client";

import {
  type FeatureFlag,
  FEATURE_FLAG_DEFAULTS,
  FEATURE_FLAG_LABELS,
  FEATURE_FLAG_DESCRIPTIONS,
} from "@/lib/feature-flags-types";

export function isFeatureEnabled(flag: FeatureFlag, flags?: Record<FeatureFlag, boolean>): boolean {
  if (flags) return flags[flag] ?? FEATURE_FLAG_DEFAULTS[flag];
  return FEATURE_FLAG_DEFAULTS[flag];
}

export function getAllFeatureFlags(): Array<{ key: FeatureFlag; label: string; description: string; default: boolean }> {
  return Object.entries(FEATURE_FLAG_DEFAULTS).map(([key, defaultValue]) => ({
    key: key as FeatureFlag,
    label: FEATURE_FLAG_LABELS[key as FeatureFlag],
    description: FEATURE_FLAG_DESCRIPTIONS[key as FeatureFlag],
    default: defaultValue,
  }));
}
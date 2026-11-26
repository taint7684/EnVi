"use client";

import { useEffect, useState, useCallback } from "react";
import type { FeatureFlag } from "@/lib/feature-flags-types";
import { FEATURE_FLAG_DEFAULTS } from "@/lib/feature-flags-types";

let clientCache: Record<FeatureFlag, boolean> | null = null;
let cachePromise: Promise<Record<FeatureFlag, boolean>> | null = null;

async function fetchFlags(): Promise<Record<FeatureFlag, boolean>> {
  const res = await fetch("/api/feature-flags");
  if (!res.ok) return FEATURE_FLAG_DEFAULTS;
  const data = await res.json();
  return { ...FEATURE_FLAG_DEFAULTS, ...data.flags } as Record<FeatureFlag, boolean>;
}

export function useFeatureFlags() {
  const [flags, setFlags] = useState<Record<FeatureFlag, boolean>>(
    clientCache ?? FEATURE_FLAG_DEFAULTS
  );
  const [loading, setLoading] = useState(!clientCache);

  useEffect(() => {
    if (clientCache) return;

    if (!cachePromise) {
      cachePromise = fetchFlags().then((f) => {
        clientCache = f;
        return f;
      });
    }

    cachePromise.then((f) => {
      setFlags(f);
      setLoading(false);
    });
  }, []);

  const isEnabled = useCallback((flag: FeatureFlag) => {
    return flags[flag] ?? FEATURE_FLAG_DEFAULTS[flag];
  }, [flags]);

  const refresh = useCallback(async () => {
    cachePromise = null;
    clientCache = null;
    const f = await fetchFlags();
    setFlags(f);
  }, []);

  return { flags, isEnabled, loading, refresh };
}

export function useFeatureFlag(flag: FeatureFlag) {
  const { flags, loading } = useFeatureFlags();
  return { enabled: flags[flag] ?? FEATURE_FLAG_DEFAULTS[flag], loading };
}

export function clearFeatureFlagsClientCache() {
  clientCache = null;
  cachePromise = null;
}
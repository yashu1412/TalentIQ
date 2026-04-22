import { platformApi } from "@/lib/api";

export type PlatformFlags = Record<string, boolean>;

const DEFAULT_FLAGS: PlatformFlags = {
  copilot_enabled: true,
  live_room_enabled: true,
  resume_pipeline_enabled: true,
  interview_replay_enabled: true,
  roadmap_enabled: true,
  portfolio_eval_enabled: true,
};

let cachedFlags: PlatformFlags | null = null;

export async function fetchFeatureFlags(): Promise<PlatformFlags> {
  if (cachedFlags) return cachedFlags;
  try {
    const response = await platformApi.getFlags();
    cachedFlags = response.data?.flags || DEFAULT_FLAGS;
  } catch {
    cachedFlags = DEFAULT_FLAGS;
  }
  return cachedFlags;
}

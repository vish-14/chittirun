import { Capacitor } from "@capacitor/core";

/** True for the static export bundled into the Android/iOS apps (BUILD_TARGET=app). */
export const IS_APP_BUILD = process.env.NEXT_PUBLIC_PLATFORM === "app";

/** Optional remote API for app builds (e.g. a future cloud leaderboard). Empty = same origin (web). */
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

/**
 * Online features (verified global leaderboard). The website has them; app builds are fully
 * local-first unless NEXT_PUBLIC_API_BASE_URL is set at build time.
 */
export const ONLINE_ENABLED = !IS_APP_BUILD || API_BASE !== "";

/** Link included in shared scores (store listing / website). */
export const SHARE_URL = process.env.NEXT_PUBLIC_SHARE_URL ?? "";

export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function nativePlatform(): "android" | "ios" | "web" {
  try {
    return Capacitor.getPlatform() as "android" | "ios" | "web";
  } catch {
    return "web";
  }
}

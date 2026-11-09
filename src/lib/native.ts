"use client";
import { isNative } from "./platform";

/**
 * Thin wrappers around Capacitor plugins. Every call is safe on the web (falls back or no-ops),
 * so game code never needs to know whether it runs in a browser or the native app.
 */
export async function hapticImpact(strong: boolean) {
  if (isNative()) {
    try {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({ style: strong ? ImpactStyle.Heavy : ImpactStyle.Light });
      return;
    } catch {
      /* fall through */
    }
  }
  try {
    navigator.vibrate?.(strong ? 160 : 40);
  } catch {
    /* unsupported */
  }
}

export async function nativeShareSheet(title: string, text: string, url?: string): Promise<boolean> {
  if (!isNative()) return false;
  try {
    const { Share } = await import("@capacitor/share");
    await Share.share({ title, text, url: url || undefined, dialogTitle: "Share your score" });
    return true;
  } catch {
    return false;
  }
}

const PREF_KEY = "chitti-run:profile:v1";

/** Durable copy of the save game in native storage (survives WebView storage eviction on iOS). */
export async function mirrorSave(json: string) {
  if (!isNative()) return;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key: PREF_KEY, value: json });
  } catch {
    /* best effort */
  }
}

export async function readNativeSave(): Promise<string | null> {
  if (!isNative()) return null;
  try {
    const { Preferences } = await import("@capacitor/preferences");
    return (await Preferences.get({ key: PREF_KEY })).value;
  } catch {
    return null;
  }
}

/**
 * App lifecycle: hide the status bar, map the Android back button and app backgrounding to
 * window events the React app understands ("chitti:back", "chitti:pause").
 */
export async function initNativeShell(): Promise<() => void> {
  if (!isNative()) return () => {};
  const cleanups: (() => void)[] = [];
  try {
    const { StatusBar } = await import("@capacitor/status-bar");
    await StatusBar.hide().catch(() => {});
  } catch {
    /* plugin missing */
  }
  try {
    const { App } = await import("@capacitor/app");
    const back = await App.addListener("backButton", () => window.dispatchEvent(new CustomEvent("chitti:back")));
    const pause = await App.addListener("pause", () => window.dispatchEvent(new CustomEvent("chitti:pause")));
    cleanups.push(() => void back.remove(), () => void pause.remove());
  } catch {
    /* plugin missing */
  }
  return () => cleanups.forEach((c) => c());
}

export async function exitApp() {
  if (!isNative()) return;
  try {
    const { App } = await import("@capacitor/app");
    await App.exitApp();
  } catch {
    /* ignore */
  }
}

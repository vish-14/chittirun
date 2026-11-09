"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import type { RunConfig } from "@/game/controller";
import { getAudio } from "@/game/audio/engine";
import { useProfile } from "@/lib/profile";
import Menu from "./screens/Menu";
import CharacterSelect from "./screens/CharacterSelect";
import LevelSelect from "./screens/LevelSelect";
import Campaign from "./screens/Campaign";
import Daily from "./screens/Daily";
import Leaderboard from "./screens/Leaderboard";
import Dashboard from "./screens/Dashboard";
import Settings from "./screens/Settings";
import HowToPlay from "./screens/HowToPlay";
import ErrorBoundary from "./ErrorBoundary";

// Phaser is ~1 MB: only download it when a run actually starts.
const GameView = dynamic(() => import("./game/GameView"), {
  ssr: false,
  loading: () => (
    <div className="font-pixel grid min-h-dvh place-items-center text-saffron" role="status">
      Loading Chitti garu…
    </div>
  ),
});

export type Screen =
  | { name: "menu" }
  | { name: "character" }
  | { name: "levels" }
  | { name: "campaign" }
  | { name: "daily" }
  | { name: "leaderboard" }
  | { name: "dashboard"; tab?: "performance" | "missions" }
  | { name: "settings" }
  | { name: "help" }
  | { name: "game"; config: RunConfig; runKey: number };

export type Nav = (s: Screen) => void;

export default function App() {
  const profile = useProfile();
  const [screen, setScreen] = useState<Screen>({ name: "menu" });
  const s = profile.settings;

  useEffect(() => {
    const el = document.documentElement;
    el.classList.toggle("high-contrast", s.highContrast);
    el.classList.toggle("large-text", s.largeText);
    el.classList.toggle("reduced-motion", s.reducedMotion);
    getAudio().setVolumes(s.music, s.sfx, s.muted);
  }, [s.highContrast, s.largeText, s.reducedMotion, s.music, s.sfx, s.muted]);

  const nav = useCallback<Nav>((next) => {
    setScreen(next);
    if (next.name !== "game") window.scrollTo(0, 0);
  }, []);

  const startRun = useCallback(
    (cfg: Omit<RunConfig, "outfit" | "relaxed" | "briefings" | "reducedMotion">) => {
      const p = profile;
      nav({
        name: "game",
        runKey: Date.now(),
        config: {
          ...cfg,
          outfit: p.outfit,
          relaxed: p.settings.relaxed,
          briefings: p.settings.briefings,
          reducedMotion: p.settings.reducedMotion,
        },
      });
    },
    [nav, profile],
  );

  const home = () => nav({ name: "menu" });

  let content: React.ReactNode;
  switch (screen.name) {
    case "menu":
      content = <Menu nav={nav} />;
      break;
    case "character":
      content = <CharacterSelect onBack={home} />;
      break;
    case "levels":
      content = <LevelSelect onBack={home} onPlay={(level) => startRun({ level, mode: "endless" })} />;
      break;
    case "campaign":
      content = (
        <Campaign
          onBack={home}
          onPlay={(chapterId, level) => startRun({ level, mode: "campaign", chapterId })}
          nav={nav}
        />
      );
      break;
    case "daily":
      content = <Daily onBack={home} onPlay={(level, dailyDate) => startRun({ level, mode: "daily", dailyDate })} />;
      break;
    case "leaderboard":
      content = <Leaderboard onBack={home} />;
      break;
    case "dashboard":
      content = <Dashboard onBack={home} initialTab={screen.tab} />;
      break;
    case "settings":
      content = <Settings onBack={home} />;
      break;
    case "help":
      content = <HowToPlay onBack={home} />;
      break;
    case "game":
      content = (
        <GameView
          key={screen.runKey}
          config={screen.config}
          onExit={home}
          onRetry={() => nav({ ...screen, runKey: Date.now() })}
          onNav={nav}
        />
      );
      break;
  }
  return <ErrorBoundary onReset={home}>{content}</ErrorBoundary>;
}

"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type * as PhaserNS from "phaser";
import { GameController, type RunConfig } from "@/game/controller";
import type { HudSnapshot, SimEvent } from "@/game/logic/sim";
import { POWERUPS } from "@/game/logic/catalog";
import type { GovernanceStage } from "@/game/logic/types";
import { startServerRun, submitServerScore } from "@/lib/api";
import { getProfile, recordRun, useProfile, type RecordOutcome, type RunResult } from "@/lib/profile";
import type { Nav } from "../App";
import Hud from "./Hud";
import { Briefing, CrisisWarning, PauseMenu, Toasts, TouchControls, type Toast } from "./Overlays";
import Results, { type ServerStatus } from "./Results";

const STAGE_ORDER: GovernanceStage[] = ["control", "pressure", "crisis", "final", "lost"];

declare global {
  interface Window {
    __chitti?: GameController;
  }
}

export default function GameView({
  config,
  onExit,
  onRetry,
  onNav,
}: {
  config: RunConfig;
  onExit: () => void;
  onRetry: () => void;
  onNav: Nav;
}) {
  const profile = useProfile();
  const hostRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<GameController | null>(null);
  const tokenRef = useRef<Promise<{ token: string } | null> | null>(null);
  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [paused, setPaused] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [warn, setWarn] = useState<GovernanceStage | null>(null);
  const [ended, setEnded] = useState<{ result: RunResult; outcome: RecordOutcome } | null>(null);
  const [server, setServer] = useState<ServerStatus>({ state: "pending" });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((x) => [...x.slice(-3), { ...t, id }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 2200);
  }, []);

  const finish = useCallback((ctrl: GameController) => {
    const sim = ctrl.sim;
    const result: RunResult = {
      mode: ctrl.config.mode,
      level: sim.level.id,
      chapterId: ctrl.config.chapterId,
      dailyDate: ctrl.config.dailyDate,
      score: Math.round(sim.score),
      coins: sim.coins,
      distance: sim.distance,
      durationSec: sim.t,
      endReason: sim.endReason ?? "quit",
      missionLog: sim.missionLog.map((m) => ({ id: m.id, status: m.status })),
      campaignStatus: ctrl.config.mode === "campaign" ? { ...sim.campaignStatus } : null,
      campaignSuccess: sim.campaignSuccess,
      bossesDefeated: sim.bossesDefeated,
      fcWins: sim.fcWins,
      fcAttempts: sim.fcAttempts,
      approval: sim.gov.approval,
      power: sim.gov.power,
      rewards: [...sim.rewardsUnlocked],
    };
    if (result.endReason === "quit") {
      onExit();
      return;
    }
    const outcome = recordRun(result);
    setEnded({ result, outcome });
    // verified leaderboard submission (best effort, never blocks the player)
    const summary = sim.summary();
    void (async () => {
      const started = await tokenRef.current;
      if (!started) return setServer({ state: "offline" });
      const r = await submitServerScore(started.token, getProfile().playerName || "Chitti Fan", summary);
      if (!r) setServer({ state: "offline" });
      else if (r.ok) setServer({ state: "accepted", rank: r.rank });
      else setServer({ state: "rejected", reason: r.reason });
    })();
  }, [onExit]);

  // ───────────── boot the run ─────────────
  useEffect(() => {
    const ctrl = new GameController(config);
    ctrlRef.current = ctrl;
    const params = new URLSearchParams(window.location.search);
    if (process.env.NODE_ENV !== "production" || params.has("debug")) window.__chitti = ctrl;
    if (params.has("demo")) ctrl.demo = true;
    tokenRef.current = startServerRun(ctrl.config.mode, ctrl.sim.level.id, {
      chapterId: config.chapterId,
      dailyDate: config.dailyDate,
    });
    let game: PhaserNS.Game | null = null;
    let disposed = false;
    const offHud = ctrl.onHud(setHud);
    const offEv = ctrl.onEvent((e: SimEvent) => {
      switch (e.type) {
        case "missionStart":
          setAnnounce(`Mission started: ${e.mission.def.title}. ${e.mission.def.objective(e.mission.target)}`);
          break;
        case "missionComplete":
          toast({ kind: "success", title: "Mission accomplished!", detail: `${e.mission.def.title} · +${e.bonus} pts · approval up` });
          setAnnounce(`Mission accomplished: ${e.mission.def.title}`);
          break;
        case "missionFail":
          toast({ kind: "fail", title: "Deadline missed!", detail: `${e.mission.def.title} · power −${e.mission.def.penalty.power}%` });
          setAnnounce(`Mission failed: ${e.mission.def.title}`);
          break;
        case "powerup":
          toast({ kind: "info", title: POWERUPS[e.kind].name, detail: POWERUPS[e.kind].description });
          break;
        case "bossStart":
          toast({ kind: "boss", title: "Boss incoming!", detail: e.name });
          break;
        case "bossDefeated":
          toast({ kind: "success", title: "Boss defeated!", detail: "+3000 pts · approval up" });
          break;
        case "bossEscaped":
          break;
        case "fcWon":
          toast({ kind: "reward", title: "Confidence restored!", detail: `Reward unlocked: ${e.reward}` });
          setAnnounce("Final confidence challenge won");
          break;
        case "stageChange":
          if (STAGE_ORDER.indexOf(e.to) > STAGE_ORDER.indexOf(e.from) && e.to !== "lost") {
            setWarn(e.to);
            setAnnounce(`Warning: ${e.to}`);
            setTimeout(() => setWarn((w) => (w === e.to ? null : w)), 2800);
          } else if (e.to === "control" || e.to === "pressure") {
            toast({ kind: "success", title: "Situation improving", detail: e.to === "control" ? "CM in Control" : "Public Pressure" });
          }
          break;
        case "gameOver":
          setTimeout(() => finish(ctrl), e.reason === "quit" ? 0 : 900);
          break;
      }
    });

    (async () => {
      try {
        const { createGame } = await import("@/game/phaser/createGame");
        if (disposed || !hostRef.current) return;
        game = createGame(hostRef.current, ctrl, config.reducedMotion);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : "Could not start the game engine");
      }
    })();

    const togglePause = () => {
      if (ctrl.sim.phase === "over") return;
      if (ctrl.paused) {
        ctrl.resume();
        setPaused(false);
      } else {
        ctrl.pause();
        setPaused(true);
      }
    };
    const forcePause = () => {
      if (ctrl.sim.phase === "over" || ctrl.paused) return;
      ctrl.pause();
      setPaused(true);
    };
    if (surfaceRef.current) ctrl.attachInput(surfaceRef.current, togglePause, forcePause);

    return () => {
      disposed = true;
      offHud();
      offEv();
      ctrl.destroy();
      game?.destroy(true);
      if (window.__chitti === ctrl) delete window.__chitti;
    };
    // config is stable for the lifetime of this component (keyed by runKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ctrl = ctrlRef.current;
  const resume = () => {
    ctrl?.resume();
    setPaused(false);
  };
  const pause = () => {
    if (!ctrl || ctrl.sim.phase === "over") return;
    ctrl.pause();
    setPaused(true);
  };

  return (
    <main className="fixed inset-0 grid place-items-center bg-ink" aria-label="Game">
      <div
        ref={surfaceRef}
        className="game-canvas relative overflow-hidden"
        style={{ width: "min(100vw, calc(100dvh * 9 / 16))", height: "min(100dvh, calc(100vw * 16 / 9))", touchAction: "none" }}
        data-testid="game-surface"
      >
        <div ref={hostRef} className="absolute inset-0" />
        {hud && !ended && <Hud s={hud} outfit={config.outfit} onPause={pause} />}
        <Toasts toasts={toasts} />
        {warn && !ended && <CrisisWarning stage={warn} />}
        {hud?.phase === "briefing" && !paused && !ended && ctrl && (
          <Briefing s={hud} outfit={config.outfit} onStart={() => ctrl.confirmBriefing()} />
        )}
        {profile.settings.touchButtons && ctrl && !ended && !paused && (
          <TouchControls onLeft={() => ctrl.left()} onRight={() => ctrl.right()} onJump={() => ctrl.jump()} onSlide={() => ctrl.slide()} />
        )}
        {paused && !ended && ctrl && (
          <PauseMenu
            onResume={resume}
            onRestart={() => {
              ctrl.destroy();
              onRetry();
            }}
            onQuit={() => {
              ctrl.quit();
            }}
          />
        )}
        {ended && (
          <Results
            result={ended.result}
            outcome={ended.outcome}
            outfit={config.outfit}
            server={server}
            onRetry={onRetry}
            onMenu={onExit}
            onCampaign={config.mode === "campaign" ? () => onNav({ name: "campaign" }) : undefined}
          />
        )}
        {loadError && (
          <div className="absolute inset-0 z-50 grid place-items-center bg-ink p-6 text-center" role="alert">
            <div className="panel p-4">
              <p className="font-pixel mb-2 text-saffron">Game engine failed to load</p>
              <p className="mb-3 text-sm text-cream/70">{loadError}. Check your connection and try again.</p>
              <button className="btn bg-saffron px-4 py-2 text-ink" onClick={onExit}>
                Back to menu
              </button>
            </div>
          </div>
        )}
        <div className="sr-only" aria-live="polite">
          {announce}
        </div>
      </div>
    </main>
  );
}

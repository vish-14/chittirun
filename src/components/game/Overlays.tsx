"use client";
import { MISSIONS } from "@/game/logic/missions";
import { STAGE_INFO } from "@/game/logic/governance";
import type { HudSnapshot } from "@/game/logic/sim";
import type { GovernanceStage } from "@/game/logic/types";
import { updateProfile, useProfile } from "@/lib/profile";
import { Button, Slider, Sprite, Toggle } from "../ui";

export function Briefing({ s, outfit, onStart }: { s: HudSnapshot; outfit: string; onStart: () => void }) {
  if (s.fc?.pending) return <FcBriefing s={s} outfit={outfit} onStart={onStart} />;
  const m = s.mission;
  if (!m) return null;
  const def = MISSIONS[m.id];
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="brief-title">
      <div className="panel animate-rise w-full max-w-xs p-4" data-testid="briefing">
        <p className="font-pixel text-[10px] uppercase tracking-widest text-teal">{m.emergency ? "🚨 Timed emergency" : "New governance mission"}</p>
        <h2 id="brief-title" className="font-pixel mt-1 text-lg font-black text-saffron">
          {m.icon} {m.title}
        </h2>
        <p className="mt-1 font-bold">{m.objective}</p>
        <ul className="mt-2 list-disc pl-5 text-sm text-cream/85">
          {def.instructions.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
        <dl className="mt-3 grid grid-cols-2 gap-x-2 text-xs">
          <dt className="text-cream/60">Deadline</dt>
          <dd className="font-pixel font-bold">{m.timeLimit}s</dd>
          <dt className="text-cream/60">Reward</dt>
          <dd className="text-emerald-300">
            +{def.reward.score} · +{def.reward.approval}% approval · +1 ❤
          </dd>
          <dt className="text-cream/60">If missed</dt>
          <dd className="text-red-300">
            −{def.penalty.power}% power · −{def.penalty.approval}% approval
          </dd>
        </dl>
        <div className="mt-2 flex justify-center">
          <Sprite sheet={`chitti-${outfit}`} frames={["face-determined"]} scale={2} animate={false} alt="Chitti looks determined" />
        </div>
        <Button size="lg" className="mt-3 w-full" onClick={onStart} autoFocus data-testid="briefing-start">
          Start mission
        </Button>
        <p className="mt-1 text-center text-[11px] text-cream/50">Tap, Space or Enter</p>
      </div>
    </div>
  );
}

function FcBriefing({ s, outfit, onStart }: { s: HudSnapshot; outfit: string; onStart: () => void }) {
  const fc = s.fc!;
  return (
    <div className="absolute inset-0 z-20 grid place-items-center bg-red-950/80 p-4" role="alertdialog" aria-modal="true" aria-labelledby="fc-title">
      <div className="panel animate-rise w-full max-w-xs border-red-500 p-4" data-testid="fc-briefing">
        <p className="font-pixel text-[10px] uppercase tracking-widest text-red-300">CM Power below 15%</p>
        <h2 id="fc-title" className="font-pixel mt-1 text-lg font-black text-red-400">
          ⚖️ Final Confidence Challenge
        </h2>
        <p className="mt-1 text-sm">
          The (fictional) opposition has tabled a no-confidence motion! Complete <b>all three</b> objectives in{" "}
          <b>{Math.round(fc.timeLimit)} seconds</b> to survive.
        </p>
        <ol className="mt-2 flex flex-col gap-1 text-sm">
          {fc.objectives.map((o, i) => (
            <li key={o.label} className="rounded bg-black/40 px-2 py-1">
              {i + 1}. {o.label}
            </li>
          ))}
        </ol>
        <p className="mt-2 text-xs text-emerald-300">Win: +35% power, +20% approval, a life and a special reward.</p>
        <p className="text-xs text-red-300">Lose: CM position lost – game over.</p>
        <div className="mt-2 flex justify-center">
          <Sprite sheet={`chitti-${outfit}`} frames={["face-shock", "face-determined"]} scale={2} fps={2} alt="Chitti, shocked then determined" />
        </div>
        <Button variant="danger" size="lg" className="mt-3 w-full" onClick={onStart} autoFocus data-testid="fc-start">
          Face the motion!
        </Button>
      </div>
    </div>
  );
}

export function PauseMenu({ onResume, onRestart, onQuit }: { onResume: () => void; onRestart: () => void; onQuit: () => void }) {
  const p = useProfile();
  const s = p.settings;
  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="pause-title">
      <div className="panel animate-rise w-full max-w-xs p-4" data-testid="pause-menu">
        <h2 id="pause-title" className="font-pixel text-center text-xl font-black text-saffron">
          Paused
        </h2>
        <p className="mb-3 text-center text-xs text-cream/60">Chitti garu is having a quick cutting chai.</p>
        <div className="flex flex-col gap-2">
          <Button size="lg" onClick={onResume} autoFocus data-testid="resume">
            ▶ Resume
          </Button>
          <Button variant="secondary" onClick={onRestart}>
            ↻ Restart run
          </Button>
          <Button variant="danger" onClick={onQuit} data-testid="quit">
            ✖ Quit to menu
          </Button>
        </div>
        <div className="mt-3 border-t border-white/10 pt-2 text-sm">
          <Toggle label="Mute" checked={s.muted} onChange={(v) => updateProfile((d) => void (d.settings.muted = v))} />
          <Slider label="Music" value={s.music} onChange={(v) => updateProfile((d) => void (d.settings.music = v))} />
          <Slider label="Effects" value={s.sfx} onChange={(v) => updateProfile((d) => void (d.settings.sfx = v))} />
        </div>
      </div>
    </div>
  );
}

export interface Toast {
  id: number;
  kind: "success" | "fail" | "info" | "boss" | "reward";
  title: string;
  detail?: string;
}

export function Toasts({ toasts }: { toasts: Toast[] }) {
  const latest = toasts.slice(-2);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[42%] z-10 flex flex-col items-center gap-2" aria-live="polite">
      {latest.map((t) => (
        <div
          key={t.id}
          data-testid={`toast-${t.kind}`}
          className={`animate-stamp rounded-md border-4 px-4 py-2 text-center shadow-[0_4px_0_#000] ${
            t.kind === "success"
              ? "border-emerald-300 bg-emerald-600"
              : t.kind === "fail"
                ? "border-red-300 bg-red-700"
                : t.kind === "boss"
                  ? "border-purple-300 bg-purple-800"
                  : t.kind === "reward"
                    ? "border-amber-200 bg-amber-500 text-ink"
                    : "border-cream bg-ink/90"
          }`}
        >
          <div className="font-pixel text-base font-black uppercase">{t.title}</div>
          {t.detail && <div className="text-xs font-semibold">{t.detail}</div>}
        </div>
      ))}
    </div>
  );
}

export function CrisisWarning({ stage }: { stage: GovernanceStage }) {
  const info = STAGE_INFO[stage];
  return (
    <div className="animate-slide-down pointer-events-none absolute inset-x-0 top-0 z-20" role="alert" data-testid="crisis-warning">
      <div className="mx-2 mt-28 rounded-md border-4 border-black px-3 py-2 text-center text-ink shadow-[0_4px_0_#000]" style={{ background: info.color }}>
        <div className="font-pixel text-lg font-black uppercase">⚠ {info.label}</div>
        <div className="text-xs font-bold">{info.blurb}</div>
      </div>
    </div>
  );
}

export function TouchControls({ onLeft, onRight, onJump, onSlide }: { onLeft: () => void; onRight: () => void; onJump: () => void; onSlide: () => void }) {
  const btn = "btn pointer-events-auto grid h-14 place-items-center bg-plum/90 text-xl text-cream select-none";
  const press = (fn: () => void) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      fn();
    },
  });
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 grid grid-cols-4 gap-2 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]" data-testid="touch-controls">
      <button type="button" aria-label="Move left" className={btn} {...press(onLeft)}>◀</button>
      <button type="button" aria-label="Jump" className={btn} {...press(onJump)}>▲</button>
      <button type="button" aria-label="Slide" className={btn} {...press(onSlide)}>▼</button>
      <button type="button" aria-label="Move right" className={btn} {...press(onRight)}>▶</button>
    </div>
  );
}

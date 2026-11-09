"use client";
import { POWERUPS } from "@/game/logic/catalog";
import { STAGE_INFO } from "@/game/logic/governance";
import type { HudSnapshot } from "@/game/logic/sim";
import type { GovernanceStage, PowerUpKind } from "@/game/logic/types";
import { Meter, Sprite } from "../ui";
import { routeProgress } from "@/game/logic/routes";
import type { LevelId } from "@/game/logic/types";

const STAGE_FACE: Record<GovernanceStage, string> = {
  control: "face-smile",
  pressure: "face-worried",
  crisis: "face-panic",
  final: "face-shock",
  lost: "face-sad",
};

const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(Math.ceil(s) % 60).padStart(2, "0")}`;

export default function Hud({ s, outfit, level, onPause }: { s: HudSnapshot; outfit: string; level: LevelId; onPause: () => void }) {
  const stage = STAGE_INFO[s.stage];
  const route = routeProgress(level, s.distance);
  const powerColor = s.power >= 70 ? "#22c55e" : s.power >= 40 ? "#eab308" : s.power >= 15 ? "#f97316" : "#ef4444";
  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col p-2 text-cream" data-testid="hud">
      {/* top row */}
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onPause}
          aria-label="Pause"
          className="btn pointer-events-auto grid h-9 w-9 shrink-0 place-items-center bg-plum p-0 text-base text-cream"
        >
          ⏸
        </button>
        <div className="flex-1">
          <div className="font-pixel flex items-baseline justify-between text-[13px] font-black drop-shadow-[0_2px_0_#000]">
            <span data-testid="score" aria-label="Score">
              {s.score.toLocaleString("en-IN")}
            </span>
            <span className="text-amber-300" aria-label="Coins">
              ● {s.coins}
            </span>
            <span className="text-teal" aria-label="Score multiplier">
              ×{s.multiplier.toFixed(s.multiplier % 1 ? 2 : 0)}
            </span>
            <span aria-label={`${s.lives} lives`} data-testid="lives" data-lives={s.lives}>
              {"❤".repeat(Math.max(0, s.lives))}
              <span className="opacity-30">{"❤".repeat(Math.max(0, 3 - s.lives))}</span>
            </span>
          </div>
          {/* governance meters */}
          <div className="mt-1 flex items-center gap-2 rounded-md border-2 border-black bg-black/45 p-1.5">
            <Sprite sheet={`chitti-${outfit}`} frames={[STAGE_FACE[s.stage]]} scale={1.25} animate={false} alt={`Chitti looks ${s.stage}`} />
            <div className="flex flex-1 flex-col gap-1">
              <Meter label="CM Power" value={s.power} color={powerColor} icon="👑" alarm={s.stage === "final"} />
              <Meter label="Public Approval" value={s.approval} color="#38bdf8" icon="👍" />
            </div>
          </div>
          <div className="mt-1 flex items-center justify-between gap-1">
            <span className="font-pixel truncate rounded bg-emerald-800/85 px-1.5 py-0.5 text-[10px] font-bold text-white" data-testid="route">
              📍 {route.current} → {route.next} {Math.ceil(route.toNext)}m
            </span>
            <span
              data-testid="stage"
              data-stage={s.stage}
              className={`font-pixel rounded px-1.5 py-0.5 text-[10px] font-black uppercase text-ink ${s.stage === "final" ? "animate-alarm" : ""}`}
              style={{ background: stage.color }}
            >
              {stage.label}
            </span>
          </div>
        </div>
      </div>

      {/* mission / challenge / boss cards */}
      <div className="mt-1 flex flex-col gap-1.5">
        {s.fc && !s.fc.pending && <FcCard fc={s.fc} />}
        {s.mission && s.phase !== "briefing" && <MissionCard m={s.mission} />}
        {!s.mission && !s.fc && s.nextMissionIn !== null && !s.boss && (
          <div className="font-pixel self-start rounded bg-black/50 px-2 py-0.5 text-[10px] text-cream/80">
            Next mission in {Math.ceil(s.nextMissionIn)}s
          </div>
        )}
        {s.demolition && <DemolitionCard d={s.demolition} />}
        {s.boss && <BossCard b={s.boss} />}
        <PowerUps p={s.powerups} />
      </div>
    </div>
  );
}

function MissionCard({ m }: { m: NonNullable<HudSnapshot["mission"]> }) {
  const urgent = m.timeLeft < 10;
  return (
    <div
      data-testid="mission-card"
      className={`w-[78%] rounded-md border-2 border-black p-1.5 ${m.emergency ? "bg-red-700/85" : "bg-ink/80"} ${urgent ? "animate-alarm" : ""}`}
    >
      <div className="flex items-center gap-1.5">
        <span aria-hidden>{m.icon}</span>
        <span className="font-pixel flex-1 text-[11px] font-black uppercase text-saffron">{m.title}</span>
        <span
          className={`font-pixel rounded px-1 text-[12px] font-black ${urgent ? "bg-red-600 text-white" : "bg-black/60"}`}
          data-testid="mission-timer"
          aria-label="Mission time left"
        >
          ⏱ {fmtTime(m.timeLeft)}
        </span>
      </div>
      <div className="text-[11px] leading-tight">{m.objective}</div>
      <div className="mt-1 flex items-center gap-1.5">
        <div className="h-2 flex-1 overflow-hidden rounded-sm border border-black bg-black/60">
          <div className="h-full bg-emerald-400 transition-[width]" style={{ width: `${(m.progress / m.target) * 100}%` }} />
        </div>
        <span className="font-pixel text-[11px] font-bold" data-testid="mission-progress">
          {m.progress}/{m.target}
        </span>
      </div>
    </div>
  );
}

function FcCard({ fc }: { fc: NonNullable<HudSnapshot["fc"]> }) {
  return (
    <div data-testid="fc-card" className="animate-alarm w-[86%] rounded-md border-2 border-black bg-red-800/90 p-1.5">
      <div className="flex items-center justify-between">
        <span className="font-pixel text-[11px] font-black uppercase">⚖️ No-confidence motion</span>
        <span className="font-pixel rounded bg-black/60 px-1 text-[13px] font-black">⏱ {fmtTime(fc.timeLeft)}</span>
      </div>
      <ul className="mt-1 flex flex-col gap-0.5">
        {fc.objectives.map((o) => (
          <li key={o.label} className={`flex justify-between text-[11px] ${o.done ? "text-emerald-300 line-through" : ""}`}>
            <span>
              {o.done ? "✔" : "□"} {o.label}
            </span>
            <span className="font-pixel">
              {o.progress}/{o.target}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DemolitionCard({ d }: { d: NonNullable<HudSnapshot["demolition"]> }) {
  return (
    <div
      data-testid="demolition-card"
      className="animate-alarm w-[86%] rounded-md border-2 border-black p-1.5 text-ink"
      style={{ background: "repeating-linear-gradient(135deg,#f5d01b 0 10px,#1b1020 10px 14px)" }}
    >
      <div className="rounded bg-[#f5d01b] px-1">
        <div className="font-pixel flex justify-between text-[11px] font-black uppercase">
          <span>🚧 HIDRA demolition!</span>
          <span data-testid="demolition-timer">⏱ {d.timeLeft.toFixed(1)}s</span>
        </div>
        <div className="text-[11px] font-bold">
          Grab {d.needed} 🛑 STAY ORDERS to stop the JCB: {d.got}/{d.needed}
        </div>
        <div className="mt-0.5 h-1.5 overflow-hidden rounded-sm bg-black/40">
          <div className="h-full bg-red-600 transition-[width]" style={{ width: `${(d.timeLeft / d.timeLimit) * 100}%` }} />
        </div>
      </div>
    </div>
  );
}

function BossCard({ b }: { b: NonNullable<HudSnapshot["boss"]> }) {
  return (
    <div data-testid="boss-card" className="w-[78%] rounded-md border-2 border-black bg-purple-900/85 p-1.5">
      <div className="font-pixel flex justify-between text-[10px] font-black uppercase">
        <span>👹 {b.name}</span>
        <span>{Math.ceil(b.timeLeft)}s</span>
      </div>
      <div className="mt-0.5 text-[10px]">Collect 📜 petitions to defeat it:</div>
      <div className="flex gap-1" aria-label={`Boss health ${b.hp} of ${b.maxHp}`}>
        {Array.from({ length: b.maxHp }, (_, i) => (
          <span key={i} className={`h-2 flex-1 rounded-sm border border-black ${i < b.hp ? "bg-red-500" : "bg-black/50"}`} />
        ))}
      </div>
    </div>
  );
}

function PowerUps({ p }: { p: Partial<Record<PowerUpKind, number>> }) {
  const entries = Object.entries(p) as [PowerUpKind, number][];
  if (!entries.length) return null;
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Active power-ups">
      {entries.map(([k, t]) => (
        <li key={k} className="flex items-center gap-1 rounded border border-black bg-black/60 px-1 py-0.5 text-[10px] font-bold">
          <Sprite sheet="props" frames={[`pu-${k}`]} scale={1} animate={false} alt="" />
          {POWERUPS[k].name} {Math.ceil(t)}s
        </li>
      ))}
    </ul>
  );
}

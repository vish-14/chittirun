"use client";
import { useState } from "react";
import { GOV_RULES, STAGE_INFO } from "@/game/logic/governance";
import { MISSIONS, MISSION_IDS } from "@/game/logic/missions";
import type { GovernanceStage } from "@/game/logic/types";
import { useProfile } from "@/lib/profile";
import { Meter, Panel, ScreenShell, Sprite } from "../ui";

const STAGE_FACE: Record<GovernanceStage, string> = {
  control: "face-grin",
  pressure: "face-worried",
  crisis: "face-panic",
  final: "face-shock",
  lost: "face-sad",
};

export default function Dashboard({ onBack, initialTab = "performance" }: { onBack: () => void; initialTab?: "performance" | "missions" }) {
  const [tab, setTab] = useState(initialTab);
  return (
    <ScreenShell title={tab === "performance" ? "CM Performance Dashboard" : "Governance Mission Board"} onBack={onBack}>
      <div role="tablist" className="grid grid-cols-2 gap-2">
        {(["performance", "missions"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`btn px-3 py-2 text-xs ${tab === t ? "bg-saffron text-ink" : "bg-plum text-cream"}`}
          >
            {t === "performance" ? "📊 Performance" : "📋 Missions"}
          </button>
        ))}
      </div>
      {tab === "performance" ? <Performance /> : <MissionBoard />}
    </ScreenShell>
  );
}

function Performance() {
  const p = useProfile();
  const s = p.stats;
  const attempts = s.missionsCompleted + s.missionsFailed;
  const rate = attempts ? Math.round((s.missionsCompleted / attempts) * 100) : 0;
  const tiles: [string, string | number][] = [
    ["Runs", s.runs],
    ["Missions done", s.missionsCompleted],
    ["Missions failed", s.missionsFailed],
    ["Success rate", `${rate}%`],
    ["Bosses beaten", s.bossesDefeated],
    ["Confidence wins", s.fcWins],
    ["CM posts lost", s.cmLost],
    ["Best approval", `${s.bestApproval}%`],
    ["Coins", s.totalCoins.toLocaleString("en-IN")],
    ["Distance", `${(s.totalDistance / 1000).toFixed(1)} km`],
  ];
  return (
    <>
      <Panel title="Term summary">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {tiles.map(([k, v]) => (
            <li key={k} className="rounded-md border-2 border-black bg-black/30 p-2">
              <span className="block text-[11px] uppercase text-cream/60">{k}</span>
              <span className="font-pixel text-lg font-bold text-saffron">{v}</span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Mission success by department">
        <ul className="flex flex-col gap-2">
          {MISSION_IDS.map((id) => {
            const m = s.byMission[id];
            const total = m.completed + m.failed;
            const pct = total ? (m.completed / total) * 100 : 0;
            return (
              <li key={id}>
                <Meter label={`${MISSIONS[id].title} (${m.completed}/${total})`} value={pct} color="#22c55e" icon={MISSIONS[id].icon} />
              </li>
            );
          })}
        </ul>
      </Panel>
      <Panel title="CM Power stages">
        <ul className="flex flex-col gap-2">
          {(Object.keys(STAGE_INFO) as GovernanceStage[]).map((st) => (
            <li key={st} className="flex items-center gap-3 rounded-md bg-black/25 p-2">
              <Sprite sheet={`chitti-${p.outfit}`} frames={[STAGE_FACE[st]]} scale={1.5} animate={false} alt={`${STAGE_INFO[st].label} expression`} />
              <span className="h-8 w-2 rounded" style={{ background: STAGE_INFO[st].color }} aria-hidden />
              <span className="flex-1">
                <span className="block font-bold">
                  {STAGE_INFO[st].label} <span className="font-pixel text-xs text-cream/60">{STAGE_INFO[st].range}</span>
                </span>
                <span className="block text-xs text-cream/70">{STAGE_INFO[st].blurb}</span>
              </span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Rewards cabinet">
        {p.rewards.length ? (
          <ul className="flex flex-wrap gap-2">
            {p.rewards.map((r) => (
              <li key={r} className="rounded bg-amber-400 px-2 py-1 text-xs font-bold text-ink">
                🏅 {r}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-cream/70">Win a Final Confidence Challenge to earn special rewards.</p>
        )}
      </Panel>
    </>
  );
}

function MissionBoard() {
  const p = useProfile();
  return (
    <>
      <Panel>
        <p className="text-sm text-cream/80">
          Missions appear during every run. Each has a deadline: finish it to gain <b className="text-emerald-400">Public Approval</b>,{" "}
          <b className="text-emerald-400">CM Power</b>, bonus points and a life back. Miss the deadline and both meters drop.
          Collisions during a mission hurt more ({GOV_RULES.collisionDuringMission.power} power) than normal ({GOV_RULES.collision.power}).
        </p>
      </Panel>
      <ul className="flex flex-col gap-3">
        {MISSION_IDS.map((id) => {
          const m = MISSIONS[id];
          const rec = p.stats.byMission[id];
          return (
            <li key={id} className="panel p-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden>
                  {m.icon}
                </span>
                <h3 className="font-pixel flex-1 font-bold text-saffron">{m.title}</h3>
                {m.emergency && <span className="rounded bg-red-600 px-1.5 text-[11px] font-bold">TIMED</span>}
              </div>
              <p className="mt-1 font-semibold">{m.objective(m.target)}</p>
              <ul className="mt-1 list-disc pl-5 text-sm text-cream/80">
                {m.instructions.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 text-xs">
                <dt className="text-cream/60">Time limit</dt>
                <dd>{m.timeLimit}s</dd>
                <dt className="text-cream/60">Reward</dt>
                <dd className="text-emerald-300">
                  +{m.reward.score} pts · +{m.reward.power} power · +{m.reward.approval} approval{m.reward.life ? " · +1 life" : ""}
                </dd>
                <dt className="text-cream/60">Failure</dt>
                <dd className="text-red-300">
                  −{m.penalty.power} power · −{m.penalty.approval} approval
                </dd>
                <dt className="text-cream/60">Your record</dt>
                <dd>
                  ✔ {rec.completed} · ✖ {rec.failed}
                </dd>
              </dl>
            </li>
          );
        })}
      </ul>
    </>
  );
}

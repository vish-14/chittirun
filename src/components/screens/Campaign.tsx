"use client";
import { useState } from "react";
import { CHAPTERS } from "@/game/logic/campaign";
import { getLevel } from "@/game/logic/levels";
import { MISSIONS } from "@/game/logic/missions";
import type { LevelId, MissionStatus } from "@/game/logic/types";
import { useProfile } from "@/lib/profile";
import { Button, Panel, ScreenShell } from "../ui";
import type { Nav } from "../App";

export const STATUS_STYLE: Record<MissionStatus | "locked" | "available", { label: string; cls: string; icon: string }> = {
  completed: { label: "Completed", cls: "bg-emerald-500 text-ink", icon: "✔" },
  pending: { label: "Pending", cls: "bg-slate-500 text-white", icon: "…" },
  active: { label: "Active", cls: "bg-amber-400 text-ink", icon: "▶" },
  failed: { label: "Failed", cls: "bg-red-600 text-white", icon: "✖" },
  locked: { label: "Locked", cls: "bg-black/60 text-cream/60", icon: "🔒" },
  available: { label: "Available", cls: "bg-teal text-ink", icon: "★" },
};

export default function Campaign({
  onBack,
  onPlay,
  nav,
}: {
  onBack: () => void;
  onPlay: (chapterId: string, level: LevelId) => void;
  nav: Nav;
}) {
  const p = useProfile();
  const [open, setOpen] = useState<string | null>(null);
  const total = CHAPTERS.length;
  const done = CHAPTERS.filter((c) => p.campaign[c.id]?.status === "completed").length;
  return (
    <ScreenShell
      title="Campaign"
      onBack={onBack}
      right={
        <Button size="sm" variant="ghost" onClick={() => nav({ name: "dashboard", tab: "missions" })}>
          Mission board
        </Button>
      }
    >
      <Panel>
        <p className="text-sm text-cream/80">
          Six milestone chapters of Chitti garu&apos;s fictional term. Complete every mission in a chapter to unlock the next.
          A failed mission gets <strong>one second chance</strong> later in the same run.
        </p>
        <p className="font-pixel mt-2 text-sm text-saffron">
          Progress: {done}/{total} chapters
        </p>
      </Panel>
      <ol className="flex flex-col gap-3">
        {CHAPTERS.map((c) => {
          const prog = p.campaign[c.id];
          const st = STATUS_STYLE[prog?.status ?? "locked"];
          const playable = prog && prog.status !== "locked";
          const expanded = open === c.id;
          return (
            <li key={c.id} className="panel p-3">
              <button
                type="button"
                className="flex w-full items-center gap-3 text-left"
                onClick={() => setOpen(expanded ? null : c.id)}
                aria-expanded={expanded}
              >
                <span className="font-pixel text-2xl text-saffron">{c.index + 1}</span>
                <span className="flex-1">
                  <span className="font-pixel block font-bold">{c.title}</span>
                  <span className="block text-xs text-cream/60">{getLevel(c.level).name}</span>
                </span>
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${st.cls}`}>
                  {st.icon} {st.label}
                </span>
              </button>
              {expanded && (
                <div className="animate-rise mt-3 border-t border-white/10 pt-3">
                  <p className="mb-2 text-sm text-cream/80">{c.brief}</p>
                  <ul className="mb-3 flex flex-col gap-1.5" aria-label={`${c.title} missions`}>
                    {c.missions.map((m) => {
                      const ms = STATUS_STYLE[prog?.missions[m] ?? "pending"];
                      return (
                        <li key={m} className="flex items-center gap-2 text-sm">
                          <span aria-hidden>{MISSIONS[m].icon}</span>
                          <span className="flex-1">
                            <strong>{MISSIONS[m].title}</strong> – {MISSIONS[m].objective(MISSIONS[m].target)}
                          </span>
                          <span className={`rounded px-1.5 text-[11px] font-bold ${ms.cls}`}>{ms.label}</span>
                        </li>
                      );
                    })}
                    {c.minApprovalAtEnd && <li className="text-sm text-amber-300">★ Finish with Public Approval ≥ {c.minApprovalAtEnd}%</li>}
                    {c.requireFinalChallengeWin && <li className="text-sm text-red-300">★ Survive the Final Confidence Challenge</li>}
                  </ul>
                  <div className="flex items-center justify-between text-xs text-cream/60">
                    <span>
                      Attempts: {prog?.attempts ?? 0} · Best: {(prog?.bestScore ?? 0).toLocaleString("en-IN")}
                    </span>
                    <Button disabled={!playable} onClick={() => onPlay(c.id, c.level)}>
                      {prog?.status === "completed" ? "Replay" : "Start chapter"}
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </ScreenShell>
  );
}

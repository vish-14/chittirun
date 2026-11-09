"use client";
import { useState } from "react";
import { dailyChallengeFor, utcDateKey } from "@/game/logic/daily";
import { getLevel } from "@/game/logic/levels";
import { ROUTES } from "@/game/logic/routes";
import type { LevelId } from "@/game/logic/types";
import { useProfile } from "@/lib/profile";
import { BgPreview, Button, Panel, ScreenShell } from "../ui";

export default function Daily({ onBack, onPlay }: { onBack: () => void; onPlay: (l: LevelId, date: string) => void }) {
  const p = useProfile();
  const [now] = useState(() => Date.now());
  const date = utcDateKey(new Date(now));
  const d = dailyChallengeFor(date);
  const best = p.daily[date] ?? 0;
  const lvl = getLevel(d.level);
  const streak = (() => {
    let n = 0;
    for (let i = 0; i < 30; i++) {
      const k = utcDateKey(new Date(now - i * 86400000));
      if ((p.daily[k] ?? 0) > 0) n++;
      else if (i > 0) break;
    }
    return n;
  })();
  return (
    <ScreenShell title="Daily challenge" onBack={onBack}>
      <Panel className="overflow-hidden p-0">
        <BgPreview level={d.level} className="h-24 bg-gradient-to-b from-[#2c3e6b] to-[#f29a6b]" />
        <div className="p-4">
          <p className="font-pixel text-xs text-cream/60">{date} (UTC) · same course for everyone</p>
          <h2 className="font-pixel mt-1 text-xl font-bold text-saffron">{d.modifier.name}</h2>
          <p className="text-sm text-cream/80">{d.modifier.description}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <dt className="text-cream/60">Level</dt>
            <dd className="font-bold">
              {lvl.name}
              <span className="block text-xs font-normal text-emerald-300">{ROUTES[d.level].name}</span>
            </dd>
            <dt className="text-cream/60">Target score</dt>
            <dd className="font-bold">{d.targetScore.toLocaleString("en-IN")}</dd>
            <dt className="text-cream/60">Your best today</dt>
            <dd className="font-pixel font-bold text-teal">{best.toLocaleString("en-IN")}</dd>
            <dt className="text-cream/60">Day streak</dt>
            <dd className="font-bold">🔥 {streak}</dd>
          </dl>
          {best >= d.targetScore && <p className="mt-2 font-bold text-emerald-400">✔ Target reached today – shabash!</p>}
          <Button size="lg" className="mt-4 w-full" onClick={() => onPlay(d.level, date)}>
            Play daily run
          </Button>
        </div>
      </Panel>
    </ScreenShell>
  );
}

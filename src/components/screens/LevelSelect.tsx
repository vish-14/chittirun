"use client";
import { LEVELS } from "@/game/logic/levels";
import { ROUTES } from "@/game/logic/routes";
import type { LevelId } from "@/game/logic/types";
import { useProfile } from "@/lib/profile";
import { BgPreview, Button, ScreenShell } from "../ui";

export default function LevelSelect({ onBack, onPlay }: { onBack: () => void; onPlay: (l: LevelId) => void }) {
  const p = useProfile();
  return (
    <ScreenShell title="Select level" onBack={onBack}>
      <ol className="flex flex-col gap-3">
        {LEVELS.map((l) => {
          const unlocked = p.unlockedLevels.includes(l.id);
          const prev = LEVELS[l.index - 1];
          const best = p.highScores[l.id] ?? 0;
          return (
            <li key={l.id} className="panel overflow-hidden p-0">
              <BgPreview level={l.id} className="h-20 bg-gradient-to-b from-[#2c3e6b] to-[#f29a6b]" />
              <div className="flex items-center gap-3 p-3">
                <div className="flex-1">
                  <h2 className="font-pixel font-bold text-saffron">
                    {l.index + 1}. {l.name}
                  </h2>
                  <p className="text-xs font-semibold text-emerald-300">📍 {ROUTES[l.id].name}</p>
                  <p className="text-xs text-cream/70">{l.tagline}</p>
                  <p className="mt-1 text-xs text-cream/60">
                    Boss: <span className="text-cream">{l.boss.name}</span>
                  </p>
                  <p className="font-pixel mt-1 text-xs">Best: {best.toLocaleString("en-IN")}</p>
                  {!unlocked && prev && (
                    <p className="mt-1 text-xs text-amber-300">
                      🔒 Score {prev.unlockNextScore.toLocaleString("en-IN")} in {prev.name} (or clear the matching campaign chapter)
                    </p>
                  )}
                </div>
                <Button disabled={!unlocked} onClick={() => onPlay(l.id)} aria-label={`Play ${l.name}`}>
                  {unlocked ? "Play" : "Locked"}
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
    </ScreenShell>
  );
}

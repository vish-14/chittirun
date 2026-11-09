"use client";
import { useState } from "react";
import { getLevel } from "@/game/logic/levels";
import { MISSIONS } from "@/game/logic/missions";
import { CHAPTERS } from "@/game/logic/campaign";
import { OUTFITS } from "@/game/art/character";
import { pickLine } from "@/lib/messages";
import type { RecordOutcome, RunResult } from "@/lib/profile";
import { nativeShare, shareText, whatsappUrl } from "@/lib/share";
import { Button, Sprite } from "../ui";

export interface ServerStatus {
  state: "pending" | "accepted" | "rejected" | "offline";
  rank?: number;
  reason?: string;
}

export default function Results({
  result,
  outcome,
  outfit,
  server,
  onRetry,
  onMenu,
  onCampaign,
}: {
  result: RunResult;
  outcome: RecordOutcome;
  outfit: string;
  server: ServerStatus;
  onRetry: () => void;
  onMenu: () => void;
  onCampaign?: () => void;
}) {
  const [line] = useState(() => pickLine(result.endReason, result.score + result.coins));
  const lost = result.endReason === "noConfidence" || result.endReason === "powerZero";
  const campaignWin = result.endReason === "campaignComplete" && result.campaignSuccess;
  const campaignEnd = result.mode === "campaign";
  const levelName = getLevel(result.level).name;
  const chapter = CHAPTERS.find((c) => c.id === result.chapterId);

  const title = lost
    ? "CM Position Lost"
    : campaignWin
      ? "Chapter Complete!"
      : campaignEnd && result.endReason === "campaignComplete"
        ? "Chapter Failed"
        : "Game Over";
  const sub = lost
    ? result.endReason === "noConfidence"
      ? "The no-confidence motion passed. Chitti garu is now… just Chitti."
      : "CM Power hit zero. The chair has been reassigned."
    : campaignWin
      ? `${chapter?.title} – all milestones achieved!`
      : result.endReason === "lives"
        ? "Out of lives."
        : chapter
          ? `${chapter.title} – some milestones were missed.`
          : "";
  const frames = lost ? ["lost-0", "lost-1"] : campaignWin ? ["victory-0", "victory-1", "victory-2", "victory-1"] : ["defeat-0", "defeat-1"];
  const text = shareText(result.score, levelName, lost ? "Lost the CM chair but kept the kurta! " : campaignWin ? `Cleared "${chapter?.title}"! ` : "");
  const url = typeof window !== "undefined" ? window.location.origin : undefined;

  return (
    <div
      className={`absolute inset-0 z-40 overflow-y-auto p-4 ${lost ? "bg-[radial-gradient(circle,#4a0d14_0%,#12060a_80%)]" : "bg-black/80"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
      data-testid={lost ? "cm-lost-screen" : "results-screen"}
    >
      <div className="mx-auto flex max-w-xs flex-col items-center gap-2 text-center">
        <h2
          id="result-title"
          className={`font-pixel animate-stamp mt-2 text-2xl font-black uppercase drop-shadow-[0_3px_0_#000] ${lost ? "text-red-500" : campaignWin ? "text-emerald-400" : "text-saffron"}`}
        >
          {title}
        </h2>
        {lost && (
          <div className="font-pixel rotate-[-4deg] rounded border-4 border-red-500 px-2 py-0.5 text-xs font-black uppercase text-red-400">
            Vote of no confidence: passed
          </div>
        )}
        <p className="text-sm text-cream/80">{sub}</p>
        <Sprite sheet={`chitti-${outfit}`} frames={frames} fps={campaignWin ? 4 : 2} scale={3} alt={title} />
        <p className="font-pixel rounded bg-black/40 px-2 py-1 text-sm italic text-amber-200">“{line}”</p>

        <div className="panel w-full p-3 text-left">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-cream/70">Final score</span>
            <span className="font-pixel text-2xl font-black text-saffron" data-testid="final-score">
              {result.score.toLocaleString("en-IN")}
            </span>
          </div>
          {outcome.newHighScore && <p className="font-pixel text-center text-xs font-bold text-emerald-400">★ New high score! ★</p>}
          <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-0.5 text-xs">
            <dt className="text-cream/60">Level</dt>
            <dd>{levelName}</dd>
            <dt className="text-cream/60">Distance</dt>
            <dd>{Math.round(result.distance)} m</dd>
            <dt className="text-cream/60">Coins</dt>
            <dd>{result.coins}</dd>
            <dt className="text-cream/60">Missions</dt>
            <dd>
              ✔ {result.missionLog.filter((m) => m.status === "completed").length} · ✖ {result.missionLog.filter((m) => m.status === "failed").length}
            </dd>
            <dt className="text-cream/60">Bosses beaten</dt>
            <dd>{result.bossesDefeated}</dd>
            <dt className="text-cream/60">Final CM Power</dt>
            <dd>{Math.round(result.power)}%</dd>
            <dt className="text-cream/60">Final approval</dt>
            <dd>{Math.round(result.approval)}%</dd>
            <dt className="text-cream/60">Leaderboard</dt>
            <dd data-testid="server-status">
              {server.state === "pending" && "Verifying…"}
              {server.state === "accepted" && `Verified · rank #${server.rank}`}
              {server.state === "rejected" && `Not accepted (${server.reason})`}
              {server.state === "offline" && "Offline – saved locally"}
            </dd>
          </dl>
          {result.campaignStatus && (
            <ul className="mt-2 border-t border-white/10 pt-2 text-xs" aria-label="Chapter missions">
              {Object.entries(result.campaignStatus).map(([id, st]) => (
                <li key={id} className="flex justify-between">
                  <span>{MISSIONS[id as keyof typeof MISSIONS].title}</span>
                  <span className={st === "completed" ? "text-emerald-400" : st === "failed" ? "text-red-400" : "text-cream/60"}>{st}</span>
                </li>
              ))}
            </ul>
          )}
          {(outcome.unlockedLevels.length > 0 || outcome.unlockedOutfits.length > 0 || result.rewards.length > 0) && (
            <div className="mt-2 rounded bg-amber-400/90 p-2 text-xs font-bold text-ink">
              {outcome.unlockedLevels.map((l) => (
                <div key={l}>🔓 New level: {getLevel(l).name}</div>
              ))}
              {outcome.unlockedOutfits.map((o) => (
                <div key={o}>👔 New outfit: {OUTFITS[o].name}</div>
              ))}
              {result.rewards.map((r) => (
                <div key={r}>🏅 {r}</div>
              ))}
            </div>
          )}
        </div>

        <div className="grid w-full grid-cols-2 gap-2">
          <a
            className="btn col-span-2 bg-[#25d366] px-4 py-2.5 text-sm text-ink"
            href={whatsappUrl(text, url)}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="whatsapp-share"
          >
            Share on WhatsApp
          </a>
          <Button variant="ghost" onClick={() => void nativeShare(text, url)}>
            Share…
          </Button>
          <Button onClick={onRetry} data-testid="retry" autoFocus>
            ↻ Retry
          </Button>
          {onCampaign && (
            <Button variant="secondary" onClick={onCampaign}>
              Campaign
            </Button>
          )}
          <Button variant="secondary" className={onCampaign ? "" : "col-span-2"} onClick={onMenu} data-testid="menu">
            Menu
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { CHAPTERS } from "@/game/logic/campaign";
import { utcDateKey } from "@/game/logic/daily";
import { LEVELS } from "@/game/logic/levels";
import { fetchLeaderboard, type BoardEntry } from "@/lib/api";
import { useProfile } from "@/lib/profile";
import { Panel, ScreenShell } from "../ui";

const BOARDS = [
  { id: `daily:${utcDateKey()}`, label: "Today" },
  ...LEVELS.map((l) => ({ id: `endless:${l.id}`, label: l.name })),
  ...CHAPTERS.map((c) => ({ id: `campaign:${c.id}`, label: c.title })),
];

export default function Leaderboard({ onBack }: { onBack: () => void }) {
  const p = useProfile();
  const [board, setBoard] = useState(BOARDS[1].id);
  const [rows, setRows] = useState<BoardEntry[] | null | "loading">("loading");
  useEffect(() => {
    let live = true;
    setRows("loading");
    void fetchLeaderboard(board).then((r) => live && setRows(r));
    return () => {
      live = false;
    };
  }, [board]);
  return (
    <ScreenShell title="Leaderboard" onBack={onBack}>
      <label className="block">
        <span className="sr-only">Board</span>
        <select
          value={board}
          onChange={(e) => setBoard(e.target.value)}
          className="w-full rounded-md border-2 border-black bg-plum px-3 py-2 font-bold text-cream"
        >
          {BOARDS.map((b) => (
            <option key={b.id} value={b.id}>
              {b.label}
            </option>
          ))}
        </select>
      </label>
      <Panel title="Global (verified scores)">
        {rows === "loading" && <p role="status">Loading…</p>}
        {rows === null && <p className="text-sm text-amber-300">Leaderboard server unreachable – showing local scores below.</p>}
        {Array.isArray(rows) && rows.length === 0 && <p className="text-sm text-cream/70">No scores yet. Be the first!</p>}
        {Array.isArray(rows) && rows.length > 0 && (
          <ol className="flex flex-col gap-1">
            {rows.map((r) => (
              <li key={`${r.rank}-${r.at}`} className="flex gap-3 rounded bg-black/20 px-2 py-1 text-sm">
                <span className="font-pixel w-6 text-saffron">{r.rank}</span>
                <span className="flex-1 truncate">{r.name}</span>
                <span className="font-pixel font-bold">{r.score.toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>
      <Panel title="Local high scores (this device)">
        {p.localBoard.length === 0 ? (
          <p className="text-sm text-cream/70">Play a run to set your first score.</p>
        ) : (
          <ol className="flex flex-col gap-1">
            {p.localBoard.map((r, i) => (
              <li key={`${r.date}-${i}`} className="flex gap-3 rounded bg-black/20 px-2 py-1 text-sm">
                <span className="font-pixel w-6 text-saffron">{i + 1}</span>
                <span className="flex-1 truncate">
                  {r.name} <span className="text-xs text-cream/50">· {LEVELS.find((l) => l.id === r.level)?.name} · {r.mode}</span>
                </span>
                <span className="font-pixel font-bold">{r.score.toLocaleString("en-IN")}</span>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </ScreenShell>
  );
}

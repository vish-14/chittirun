"use client";
import { Button, Sprite } from "../ui";
import { useProfile } from "@/lib/profile";
import type { Nav } from "../App";
import { dailyChallengeFor, utcDateKey } from "@/game/logic/daily";

export default function Menu({ nav }: { nav: Nav }) {
  const p = useProfile();
  const daily = dailyChallengeFor(utcDateKey());
  const best = Math.max(0, ...Object.values(p.highScores).map((v) => v ?? 0));
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center gap-5 overflow-hidden px-4 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,#4a2a66_0%,#1b1020_60%)]" />
      <div className="text-center">
        <p className="font-pixel text-xs uppercase tracking-[0.3em] text-teal">A fictional satire runner</p>
        <h1 className="font-pixel mt-1 text-4xl font-black uppercase leading-none text-saffron drop-shadow-[0_4px_0_#000] sm:text-5xl">
          Chitti Naidu
          <span className="block text-cream">Run</span>
        </h1>
        <p className="font-pixel mt-2 text-sm uppercase text-cream/80">The Great CM Escape</p>
      </div>

      <div className="flex items-end gap-2">
        <Sprite sheet={`chitti-${p.outfit}`} frames={["flag-0", "flag-1", "flag-2"]} scale={3} fps={5} alt="Fictional Bongaram Praja Party flag" />
        <Sprite sheet={`chitti-${p.outfit}`} frames={["victory-0", "victory-1", "victory-2", "victory-1"]} scale={4} fps={4} alt="Chitti Naidu flashing a victory sign" />
      </div>

      <nav className="grid w-full max-w-sm grid-cols-2 gap-3" aria-label="Main menu">
        <Button size="lg" className="col-span-2" onClick={() => nav({ name: "levels" })}>
          ▶ Endless Run
        </Button>
        <Button variant="secondary" onClick={() => nav({ name: "campaign" })}>
          🗳️ Campaign
        </Button>
        <Button variant="secondary" onClick={() => nav({ name: "daily" })}>
          📅 Daily
        </Button>
        <Button variant="ghost" onClick={() => nav({ name: "character" })}>
          👤 Character
        </Button>
        <Button variant="ghost" onClick={() => nav({ name: "leaderboard" })}>
          🏆 Leaders
        </Button>
        <Button variant="ghost" onClick={() => nav({ name: "dashboard" })}>
          📊 CM Dashboard
        </Button>
        <Button variant="ghost" onClick={() => nav({ name: "dashboard", tab: "missions" })}>
          📋 Mission Board
        </Button>
        <Button variant="ghost" onClick={() => nav({ name: "help" })}>
          ❓ How to play
        </Button>
        <Button variant="ghost" onClick={() => nav({ name: "settings" })}>
          ⚙️ Settings
        </Button>
      </nav>

      <div className="panel w-full max-w-sm p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-cream/70">Best endless score</span>
          <span className="font-pixel font-bold text-saffron">{best.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-cream/70">Today&apos;s challenge</span>
          <span className="font-pixel font-bold text-teal">{daily.modifier.name}</span>
        </div>
      </div>

      <footer className="mt-auto max-w-sm text-center text-[11px] leading-snug text-cream/50">
        Chitti Naidu, the Bongaram Praja Party and every place, mission and event in this game are entirely fictional.
        Any resemblance to real persons, parties or governments is coincidental. All art and music are original.
      </footer>
    </main>
  );
}

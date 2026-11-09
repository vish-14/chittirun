"use client";
import { useState } from "react";
import { OUTFITS, type Outfit } from "@/game/art/character";
import { updateProfile, useProfile } from "@/lib/profile";
import { Button, Panel, ScreenShell, Sprite } from "../ui";

const ANIMS: { id: string; label: string; frames: string[]; fps: number }[] = [
  { id: "victory", label: "Victory", frames: ["victory-0", "victory-1", "victory-2", "victory-1"], fps: 4 },
  { id: "idle", label: "Idle", frames: ["idle-0", "idle-1"], fps: 2 },
  { id: "run", label: "Run", frames: ["run-0", "run-1", "run-2", "run-3"], fps: 10 },
  { id: "panic", label: "Crisis run", frames: ["panic-0", "panic-1", "panic-2", "panic-3"], fps: 12 },
  { id: "jump", label: "Jump", frames: ["jump-0", "jump-1"], fps: 3 },
  { id: "slide", label: "Slide", frames: ["slide-0", "slide-1"], fps: 6 },
  { id: "hit", label: "Collision", frames: ["hit-0", "hit-1"], fps: 8 },
  { id: "defeat", label: "Defeat", frames: ["defeat-0", "defeat-1"], fps: 2 },
];

export default function CharacterSelect({ onBack }: { onBack: () => void }) {
  const p = useProfile();
  const [anim, setAnim] = useState(ANIMS[0]);
  const [name, setName] = useState(p.playerName);
  const select = (o: Outfit) => updateProfile((d) => void (d.outfit = o));
  return (
    <ScreenShell title="Choose your CM" onBack={onBack}>
      <Panel className="flex flex-col items-center gap-3">
        <Sprite key={`${p.outfit}-${anim.id}`} sheet={`chitti-${p.outfit}`} frames={anim.frames} fps={anim.fps} scale={5} alt={`Chitti Naidu ${anim.label} animation`} />
        <p className="font-pixel text-lg font-bold text-saffron">Chitti Naidu</p>
        <p className="text-center text-sm text-cream/80">
          Fictional Chief Minister. Signature pompadour, neatly trimmed beard, white kurta, orange waistcoat and
          teal sneakers for emergency sprints. Fuelled by Irani chai and optimism.
        </p>
        <div className="flex flex-wrap justify-center gap-1.5" role="group" aria-label="Preview animation">
          {ANIMS.map((a) => (
            <Button key={a.id} size="sm" variant={a.id === anim.id ? "primary" : "ghost"} onClick={() => setAnim(a)} aria-pressed={a.id === anim.id}>
              {a.label}
            </Button>
          ))}
        </div>
      </Panel>

      <Panel title="Outfits">
        <ul className="grid grid-cols-2 gap-3">
          {(Object.keys(OUTFITS) as Outfit[]).map((o) => {
            const unlocked = p.unlockedOutfits.includes(o);
            const active = p.outfit === o;
            return (
              <li key={o}>
                <button
                  type="button"
                  disabled={!unlocked}
                  onClick={() => select(o)}
                  aria-pressed={active}
                  className={`flex w-full flex-col items-center gap-1 rounded-md border-2 p-2 text-center ${active ? "border-saffron bg-saffron/15" : "border-black bg-black/30"} disabled:opacity-60`}
                >
                  <Sprite sheet={`chitti-${o}`} frames={["idle-0"]} scale={2} animate={false} alt={OUTFITS[o].name} />
                  <span className="text-sm font-bold">{OUTFITS[o].name}</span>
                  <span className="text-[11px] text-cream/60">{unlocked ? (active ? "Selected" : "Tap to wear") : `🔒 ${OUTFITS[o].unlock}`}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Leaderboard name">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            updateProfile((d) => void (d.playerName = name.trim().slice(0, 16)));
          }}
        >
          <input
            value={name}
            maxLength={16}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            aria-label="Leaderboard name"
            className="min-w-0 flex-1 rounded-md border-2 border-black bg-black/40 px-3 py-2 text-cream"
          />
          <Button type="submit" size="sm" onClick={() => updateProfile((d) => void (d.playerName = name.trim().slice(0, 16)))}>
            Save
          </Button>
        </form>
      </Panel>
    </ScreenShell>
  );
}

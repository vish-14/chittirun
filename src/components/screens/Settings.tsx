"use client";
import { useState } from "react";
import { resetProfile, updateProfile, useProfile, type Settings as S } from "@/lib/profile";
import { Button, Panel, ScreenShell, Slider, Toggle } from "../ui";

export default function Settings({ onBack }: { onBack: () => void }) {
  const p = useProfile();
  const s = p.settings;
  const [confirm, setConfirm] = useState(false);
  const set = <K extends keyof S>(k: K, v: S[K]) => updateProfile((d) => void (d.settings[k] = v));
  return (
    <ScreenShell title="Settings" onBack={onBack}>
      <Panel title="Sound">
        <Toggle label="Mute all" checked={s.muted} onChange={(v) => set("muted", v)} />
        <Slider label="Music" value={s.music} onChange={(v) => set("music", v)} />
        <Slider label="Sound effects" value={s.sfx} onChange={(v) => set("sfx", v)} />
      </Panel>
      <Panel title="Gameplay">
        <Toggle
          label="Mission briefings"
          description="Pause with clear instructions before every mission."
          checked={s.briefings}
          onChange={(v) => set("briefings", v)}
        />
        <Toggle
          label="Relaxed mode"
          description="Slower traffic, wider gaps and 25% longer mission timers."
          checked={s.relaxed}
          onChange={(v) => set("relaxed", v)}
        />
        <Toggle
          label="On-screen control buttons"
          description="Show tap buttons instead of (or as well as) swipes."
          checked={s.touchButtons}
          onChange={(v) => set("touchButtons", v)}
        />
      </Panel>
      <Panel title="Accessibility">
        <Toggle label="Reduce motion" description="No screen shake, lightning or flashing." checked={s.reducedMotion} onChange={(v) => set("reducedMotion", v)} />
        <Toggle label="High contrast" checked={s.highContrast} onChange={(v) => set("highContrast", v)} />
        <Toggle label="Larger text" checked={s.largeText} onChange={(v) => set("largeText", v)} />
      </Panel>
      <Panel title="Data">
        <p className="mb-2 text-sm text-cream/70">Progress is saved on this device (local storage). Leaderboard names are public.</p>
        {confirm ? (
          <div className="flex gap-2">
            <Button
              variant="danger"
              onClick={() => {
                resetProfile();
                setConfirm(false);
              }}
            >
              Yes, reset everything
            </Button>
            <Button variant="ghost" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirm(true)}>
            Reset progress
          </Button>
        )}
      </Panel>
    </ScreenShell>
  );
}

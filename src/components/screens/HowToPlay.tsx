"use client";
import { POWERUPS } from "@/game/logic/catalog";
import { STAGE_INFO } from "@/game/logic/governance";
import type { GovernanceStage, PowerUpKind } from "@/game/logic/types";
import { Panel, ScreenShell, Sprite } from "../ui";

export default function HowToPlay({ onBack }: { onBack: () => void }) {
  return (
    <ScreenShell title="How to play" onBack={onBack}>
      <Panel title="Controls">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-cream/60">
              <th className="py-1">Action</th>
              <th>Keyboard</th>
              <th>Touch</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="py-1">Change lane</td><td>← → / A D</td><td>Swipe left / right</td></tr>
            <tr><td className="py-1">Jump</td><td>↑ / W / Space</td><td>Swipe up</td></tr>
            <tr><td className="py-1">Slide</td><td>↓ / S</td><td>Swipe down</td></tr>
            <tr><td className="py-1">Pause</td><td>Esc / P</td><td>⏸ button</td></tr>
            <tr><td className="py-1">Start mission</td><td>Enter / Space</td><td>Tap</td></tr>
          </tbody>
        </table>
        <p className="mt-2 text-xs text-cream/60">Prefer buttons? Enable “On-screen control buttons” in Settings.</p>
      </Panel>
      <Panel title="Obstacles">
        <ul className="grid grid-cols-1 gap-1 text-sm">
          <li>⬆️ <b>Jump</b> over barricades, cones, speed breakers, puddles and burst pipes.</li>
          <li>⬇️ <b>Slide</b> under banners, cables, red tape and boom gates.</li>
          <li>↔️ <b>Change lane</b> for autos, buses, tankers, cows, carts, jams and file towers.</li>
          <li>🕳️ <b>Potholes:</b> jump over them – or slide over them to <b>fix</b> them!</li>
          <li>🌊 <b>Waterlogged roads</b>, 🚗 <b>traffic jams</b> and potholes are on every route – and the public will ask the CM about each one.</li>
        </ul>
      </Panel>
      <Panel title="Power-ups">
        <ul className="flex flex-col gap-2">
          {(Object.keys(POWERUPS) as PowerUpKind[]).map((k) => (
            <li key={k} className="flex items-center gap-3">
              <Sprite sheet="props" frames={[`pu-${k}`]} scale={2} animate={false} alt={POWERUPS[k].name} />
              <span className="text-sm">
                <b>{POWERUPS[k].name}</b> ({POWERUPS[k].duration}s) – {POWERUPS[k].description}
              </span>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="CM Power & Public Approval">
        <p className="mb-2 text-sm text-cream/80">
          <b>CM Power</b> is Chitti&apos;s fictional political authority. It slowly drains, drops on collisions and failed missions, and
          rises when missions succeed. <b>Public Approval</b> goes up with missions, bosses and coins; above 80% it multiplies your score ×1.5.
        </p>
        <ul className="flex flex-col gap-1 text-sm">
          {(Object.keys(STAGE_INFO) as GovernanceStage[]).map((s) => (
            <li key={s}>
              <span className="mr-2 inline-block h-3 w-3 rounded-sm align-middle" style={{ background: STAGE_INFO[s].color }} />
              <b>{STAGE_INFO[s].range}</b> {STAGE_INFO[s].label}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-sm text-cream/80">
          Below 15% a <b>no-confidence motion</b> starts: complete three objectives within the time limit to restore power and win a
          reward. Fail, and Chitti garu loses the CM post.
        </p>
      </Panel>
      <Panel title="🚧 HYDRA demolition alerts">
        <p className="text-sm text-cream/80">
          Mid-run, a HYDRA van and a JCB show up at a family&apos;s house. You get <b>5–10 seconds</b> (less as the run goes on):
          grab <b>3 🛑 STAY ORDERS</b> to stop the demolition (+1500 pts, +approval). Too slow and the building is demolished –
          <b> CM Power −10%</b>, approval −8%.
        </p>
      </Panel>
      <Panel title="Bosses">
        <p className="text-sm text-cream/80">
          Every level has a boss encounter. Dodge the attacks (watch for ⚠️ lane warnings) and collect 5 <b>Public Petitions</b> to defeat
          it for a big bonus.
        </p>
      </Panel>
    </ScreenShell>
  );
}

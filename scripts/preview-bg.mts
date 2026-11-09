import { writeScaled } from "./png-util.mts";
import { backgroundFrames, THEMES } from "../src/game/art/backgrounds";
import { PixelCanvas } from "../src/game/art/painter";
const levels = Object.keys(THEMES) as (keyof typeof THEMES)[];
const out = new PixelCanvas(256, levels.length * 180);
levels.forEach((l, i) => {
  const t = THEMES[l];
  out.gradient(0, i * 180, 256, 180, t.skyTop, t.skyBottom, 8);
  const [f, n] = backgroundFrames(l);
  out.blit(f.canvas, 0, i * 180 + 10);
  out.blit(n.canvas, 0, i * 180 + 60);
  out.rect(0, i * 180 + 132, 256, 48, t.road);
});
writeScaled(out, process.argv[2], 2);

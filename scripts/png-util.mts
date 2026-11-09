import { PNG } from "pngjs";
import fs from "node:fs";
import type { PixelCanvas } from "../src/game/art/painter";

export function writeScaled(c: PixelCanvas, file: string, scale: number, bg = [90, 120, 140]) {
  const png = new PNG({ width: c.w * scale, height: c.h * scale });
  for (let y = 0; y < c.h * scale; y++)
    for (let x = 0; x < c.w * scale; x++) {
      const i = (Math.floor(y / scale) * c.w + Math.floor(x / scale)) * 4;
      const o = (y * c.w * scale + x) * 4;
      const a = c.data[i + 3] / 255;
      png.data[o] = c.data[i] * a + bg[0] * (1 - a);
      png.data[o + 1] = c.data[i + 1] * a + bg[1] * (1 - a);
      png.data[o + 2] = c.data[i + 2] * a + bg[2] * (1 - a);
      png.data[o + 3] = 255;
    }
  fs.writeFileSync(file, PNG.sync.write(png));
}

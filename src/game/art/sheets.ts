import { LEVELS } from "../logic/levels";
import { backgroundFrames } from "./backgrounds";
import { OUTFITS, characterFrames, flagFrames, portraitFrames, type Outfit } from "./character";
import { packFrames, type PackedSheet, type PixelCanvas } from "./painter";
import { propFrames } from "./props";

export type SheetKey = `chitti-${Outfit}` | "props";
export type ImageKey = `bg-${string}-far` | `bg-${string}-near`;

export function buildCharacterSheet(outfit: Outfit): PackedSheet {
  const frames = [...characterFrames(), ...portraitFrames(), ...flagFrames()];
  const sheet = packFrames(frames, 512);
  sheet.canvas.recolor(OUTFITS[outfit].swap);
  return sheet;
}

export function buildAtlases(): Record<string, PackedSheet> {
  const out: Record<string, PackedSheet> = {};
  for (const o of Object.keys(OUTFITS) as Outfit[]) out[`chitti-${o}`] = buildCharacterSheet(o);
  out.props = packFrames(propFrames(), 1024);
  return out;
}

export function buildImages(): Record<string, PixelCanvas> {
  const out: Record<string, PixelCanvas> = {};
  for (const l of LEVELS) for (const f of backgroundFrames(l.id)) out[f.name] = f.canvas;
  return out;
}

/** Phaser "JSON Hash" atlas format. */
export function toPhaserAtlas(sheet: PackedSheet, image: string) {
  const frames: Record<string, unknown> = {};
  for (const [name, r] of Object.entries(sheet.frames)) {
    frames[name] = {
      frame: { x: r.x, y: r.y, w: r.w, h: r.h },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: r.w, h: r.h },
      sourceSize: { w: r.w, h: r.h },
    };
  }
  return { frames, meta: { app: "chitti-run-asset-gen", image, size: { w: sheet.canvas.w, h: sheet.canvas.h }, scale: "1" } };
}

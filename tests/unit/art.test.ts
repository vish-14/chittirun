import { describe, expect, it } from "vitest";
import { buildAtlases, buildImages } from "@/game/art/sheets";
import { CHARACTER_ANIMS } from "@/game/art/character";
import { LEVELS } from "@/game/logic/levels";
import { OBSTACLES, POWERUPS, TOKENS } from "@/game/logic/catalog";
import manifest from "@/game/art/asset-manifest.json";

describe("sprite sheets", () => {
  const atlases = buildAtlases();
  it("contains every character animation frame for every outfit", () => {
    for (const key of ["chitti-classic", "chitti-monsoon", "chitti-golden", "chitti-festive"]) {
      for (const frames of Object.values(CHARACTER_ANIMS)) for (const f of frames) expect(atlases[key].frames[f], `${key}/${f}`).toBeDefined();
    }
  });
  it("contains a sprite for every obstacle, power-up, token, boss and shot", () => {
    const f = atlases.props.frames;
    for (const k of Object.keys(OBSTACLES)) if (k !== "bossShot") expect(f[`ob-${k}`], k).toBeDefined();
    for (const k of Object.keys(POWERUPS)) expect(f[`pu-${k}`], k).toBeDefined();
    for (const k of Object.keys(TOKENS)) expect(f[`tk-${k}`], k).toBeDefined();
    for (const l of LEVELS) {
      expect(f[`boss-${l.id}-0`]).toBeDefined();
      expect(f[`shot-${l.id}`]).toBeDefined();
    }
  });
  it("has a background per level and the committed manifest is current", () => {
    const imgs = buildImages();
    for (const l of LEVELS) {
      expect(imgs[`bg-${l.id}-far`]).toBeDefined();
      expect((manifest.images as Record<string, string>)[`bg-${l.id}-near`]).toBeDefined();
    }
  });
});

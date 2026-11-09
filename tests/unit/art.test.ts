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

import { ROUTES, routeProgress, stopSlug, STOP_SPACING } from "@/game/logic/routes";

describe("Hyderabad routes & street art", () => {
  const f = buildAtlases().props.frames;
  it("has a green signboard for every real stop on every route", () => {
    for (const r of Object.values(ROUTES)) for (const s of r.stops) expect(f[`sign-${stopSlug(s)}`], s).toBeDefined();
  });
  it("has paan shops, malls, metro, broken lights and football fan art", () => {
    for (const k of ["rs-paan", "rs-paan2", "rs-mall", "rs-irani", "rs-biryani", "rs-metro-pillar", "rs-lamp-broken", "rs-lamp-broken-on", "rs-signal-broken", "rs-poster-football", "rs-poster-football2", "rs-fanflags", "rs-football-kids", "fx-metro-train", "crowd-6-cheer-0", "rs-poster-cmdown", "rs-poster-wewant", "rs-poster-votecar", "rs-poster-wall", "rs-water-queue", "rs-dry-tap", "bd-apartment", "bd-apartment2", "bd-apartment3", "bd-complex", "bd-mall2", "dm-house", "dm-rubble", "dm-van", "dm-jcb-0", "tk-stayOrder"])
      expect(f[k], k).toBeDefined();
  });
  it("tracks progress along the route and loops", () => {
    expect(routeProgress("traffic", 0)).toMatchObject({ current: "Ameerpet", next: "Punjagutta" });
    expect(routeProgress("traffic", STOP_SPACING + 1).current).toBe("Punjagutta");
    expect(routeProgress("traffic", STOP_SPACING * 6).current).toBe("Ameerpet");
  });
});

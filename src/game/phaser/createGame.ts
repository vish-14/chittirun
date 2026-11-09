import * as Phaser from "phaser";
import type { GameController } from "../controller";
import { RunScene, VIEW_H, VIEW_W } from "./RunScene";

export function createGame(parent: HTMLElement, ctrl: GameController, reducedMotion: boolean): Phaser.Game {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: VIEW_W,
    height: VIEW_H,
    pixelArt: true,
    roundPixels: true,
    backgroundColor: "#1b1020",
    banner: false,
    audio: { noAudio: true }, // all audio is our own WebAudio engine
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    fps: { target: 60, smoothStep: true },
    render: { antialias: false, powerPreference: "high-performance" },
    input: { keyboard: false, mouse: true, touch: true },
    scene: [],
  });
  game.scene.add("run", RunScene, true, { ctrl, reducedMotion });
  return game;
}

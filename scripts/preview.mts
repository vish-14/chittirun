import { writeScaled } from "./png-util.mts";
import { packFrames, type Frame } from "../src/game/art/painter";
import { characterFrames, portraitFrames, flagFrames } from "../src/game/art/character";

const which = process.argv[2] ?? "char";
let frames: Frame[] = [];
if (which === "char") frames = [...characterFrames(), ...portraitFrames(), ...flagFrames()];
else frames = (await import("../src/game/art/props")).propFrames();
const sheet = packFrames(frames, 480);
writeScaled(sheet.canvas, process.argv[3], Number(process.argv[4] ?? 3));


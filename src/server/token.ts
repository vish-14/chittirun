import crypto from "node:crypto";
import type { GameMode, LevelId } from "@/game/logic/types";

export interface RunTokenPayload {
  v: 1;
  rid: string; // run id
  iat: number; // issued at (ms)
  mode: GameMode;
  level: LevelId;
  board: string;
}

const b64 = (b: Buffer | string) => Buffer.from(b).toString("base64url");

export function signRunToken(p: RunTokenPayload, secret: string): string {
  const body = b64(JSON.stringify(p));
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifyRunToken(token: unknown, secret: string): RunTokenPayload | null {
  if (typeof token !== "string" || token.length > 2048) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", secret).update(body).digest();
  let given: Buffer;
  try {
    given = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as RunTokenPayload;
    if (p.v !== 1 || typeof p.rid !== "string" || typeof p.iat !== "number") return null;
    return p;
  } catch {
    return null;
  }
}

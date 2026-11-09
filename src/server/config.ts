import "server-only";
import crypto from "node:crypto";

let devSecret: string | null = null;

export type Stage = "development" | "staging" | "production";

export function appStage(): Stage {
  const s = process.env.APP_STAGE;
  return s === "production" || s === "staging" ? s : "development";
}

/** HMAC secret for run tokens. Server-only; never exposed to the browser bundle. */
export function runTokenSecret(): string | null {
  const s = process.env.RUN_TOKEN_SECRET;
  if (s && s.length >= 32) return s;
  if (appStage() !== "development") return null; // refuse to run insecurely in staging/prod
  if (!devSecret) {
    devSecret = crypto.randomBytes(32).toString("hex");
    console.warn("[chitti-run] RUN_TOKEN_SECRET not set – using an ephemeral development secret.");
  }
  return devSecret;
}

import { NextResponse } from "next/server";
import type { ApiResult } from "@/server/handlers";

export async function readJson(req: Request): Promise<unknown> {
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > 32 * 1024) throw new Error("payload-too-large");
  const text = await req.text();
  if (text.length > 32 * 1024) throw new Error("payload-too-large");
  return text ? JSON.parse(text) : {};
}

export function respond(r: ApiResult) {
  return NextResponse.json(r.body, { status: r.status, headers: { "Cache-Control": "no-store" } });
}

export function fail(e: unknown) {
  const msg = e instanceof Error ? e.message : "error";
  if (msg === "payload-too-large") return NextResponse.json({ ok: false, reason: msg }, { status: 413 });
  if (e instanceof SyntaxError) return NextResponse.json({ ok: false, reason: "bad-json" }, { status: 400 });
  console.error(JSON.stringify({ svc: "chitti-run-api", event: "error", message: msg }));
  return NextResponse.json({ ok: false, reason: "server-error" }, { status: 500 });
}

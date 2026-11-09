import { NextResponse } from "next/server";
import { appStage } from "@/server/config";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({ ok: true, stage: appStage(), store: process.env.DDB_TABLE_NAME ? "dynamodb" : "memory" });
}

import { leaderboard } from "@/server/handlers";
import { fail, respond } from "../_util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    return respond(await leaderboard(new URL(req.url).searchParams, req.headers));
  } catch (e) {
    return fail(e);
  }
}

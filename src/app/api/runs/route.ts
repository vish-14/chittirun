import { startRun } from "@/server/handlers";
import { fail, readJson, respond } from "../_util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    return respond(await startRun(await readJson(req), req.headers));
  } catch (e) {
    return fail(e);
  }
}

/**
 * OPTIONAL standalone AWS Lambda entry point (API Gateway HTTP API, payload v2) for the score API,
 * if you prefer to run the API outside Amplify Hosting's managed compute. Reuses the exact same
 * framework-agnostic handlers as the Next.js route handlers. Bundle with esbuild:
 *   npx esbuild infra/lambda/handler.ts --bundle --platform=node --target=node22 \
 *     --alias:server-only=./infra/lambda/empty.js --alias:@=./src --outfile=dist/lambda/index.js
 */
import { leaderboard, startRun, submitScore } from "../../src/server/handlers";

interface HttpEvent {
  rawPath: string;
  rawQueryString?: string;
  body?: string;
  isBase64Encoded?: boolean;
  headers?: Record<string, string>;
  requestContext: { http: { method: string; sourceIp?: string } };
}

export async function handler(event: HttpEvent) {
  const headers = new Headers(event.headers ?? {});
  if (event.requestContext.http.sourceIp) headers.set("x-forwarded-for", event.requestContext.http.sourceIp);
  const method = event.requestContext.http.method;
  try {
    const raw = event.body ? (event.isBase64Encoded ? Buffer.from(event.body, "base64").toString("utf8") : event.body) : "";
    if (raw.length > 32 * 1024) return json(413, { ok: false, reason: "payload-too-large" });
    const body = raw ? JSON.parse(raw) : {};
    let r;
    if (method === "POST" && event.rawPath === "/api/runs") r = await startRun(body, headers);
    else if (method === "POST" && event.rawPath === "/api/scores") r = await submitScore(body, headers);
    else if (method === "GET" && event.rawPath === "/api/leaderboard") r = await leaderboard(new URLSearchParams(event.rawQueryString ?? ""), headers);
    else return json(404, { ok: false, reason: "not-found" });
    return json(r.status, r.body);
  } catch (e) {
    console.error(JSON.stringify({ svc: "chitti-run-api", event: "error", message: e instanceof Error ? e.message : String(e) }));
    return json(500, { ok: false, reason: "server-error" });
  }
}

function json(statusCode: number, body: unknown) {
  return { statusCode, headers: { "content-type": "application/json", "cache-control": "no-store" }, body: JSON.stringify(body) };
}

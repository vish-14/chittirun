import "server-only";
import { DynamoDBClient, ConditionalCheckFailedException } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import type { ScoreEntry, ScoreStore } from "./store";

/**
 * Single-table design (on-demand billing, no always-on cost):
 *   PK = "RUN#<runId>"            SK = "RUN"                 (replay protection, TTL attribute `expiresAt`)
 *   PK = "BOARD#<board>"          SK = "<zero-padded score>#<runId>"   (leaderboard rows, newest-first query)
 *   PK = "PLAYER#<id>"            SK = "PROFILE" | "CAMPAIGN"  (reserved for cloud profile sync)
 * Scores are zero-padded so a descending Query on SK returns the top N directly – no GSI or scans.
 */
export class DynamoStore implements ScoreStore {
  private doc: DynamoDBDocumentClient;
  constructor(
    private table: string,
    region: string,
  ) {
    this.doc = DynamoDBDocumentClient.from(new DynamoDBClient({ region }), {
      marshallOptions: { removeUndefinedValues: true },
    });
  }

  async claimRun(runId: string, ttlSeconds: number) {
    try {
      await this.doc.send(
        new PutCommand({
          TableName: this.table,
          Item: { PK: `RUN#${runId}`, SK: "RUN", expiresAt: Math.floor(Date.now() / 1000) + ttlSeconds },
          ConditionExpression: "attribute_not_exists(PK)",
        }),
      );
      return true;
    } catch (e) {
      if (e instanceof ConditionalCheckFailedException) return false;
      throw e;
    }
  }

  async putScore(e: ScoreEntry) {
    await this.doc.send(
      new PutCommand({
        TableName: this.table,
        Item: {
          PK: `BOARD#${e.board}`,
          SK: `${String(e.score).padStart(12, "0")}#${e.runId}`,
          name: e.name,
          score: e.score,
          level: e.level,
          at: e.at,
          // daily boards expire after 40 days to keep storage costs near zero
          ...(e.board.startsWith("daily:") ? { expiresAt: Math.floor(Date.now() / 1000) + 40 * 86400 } : {}),
        },
      }),
    );
  }

  async top(board: string, limit: number) {
    const r = await this.doc.send(
      new QueryCommand({
        TableName: this.table,
        KeyConditionExpression: "PK = :pk",
        ExpressionAttributeValues: { ":pk": `BOARD#${board}` },
        ScanIndexForward: false,
        Limit: limit,
      }),
    );
    return (r.Items ?? []).map((i) => ({
      board,
      name: String(i.name),
      score: Number(i.score),
      runId: String(i.SK).split("#")[1] ?? "",
      level: String(i.level ?? ""),
      at: String(i.at ?? ""),
    }));
  }

  async rankOf(board: string, score: number) {
    const r = await this.doc.send(
      new QueryCommand({
        TableName: this.table,
        KeyConditionExpression: "PK = :pk AND SK > :sk",
        ExpressionAttributeValues: { ":pk": `BOARD#${board}`, ":sk": `${String(score).padStart(12, "0")}#~` },
        Select: "COUNT",
      }),
    );
    return (r.Count ?? 0) + 1;
  }
}

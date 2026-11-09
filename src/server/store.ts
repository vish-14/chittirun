import "server-only";

export interface ScoreEntry {
  board: string;
  name: string;
  score: number;
  runId: string;
  level: string;
  at: string;
}

export interface ScoreStore {
  /** Atomically mark a run id as used. Returns false if it was already used (replay). */
  claimRun(runId: string, ttlSeconds: number): Promise<boolean>;
  putScore(e: ScoreEntry): Promise<void>;
  top(board: string, limit: number): Promise<ScoreEntry[]>;
  rankOf(board: string, score: number): Promise<number | null>;
}

class MemoryStore implements ScoreStore {
  private used = new Map<string, number>();
  private boards = new Map<string, ScoreEntry[]>();

  async claimRun(runId: string, ttl: number) {
    const now = Date.now();
    for (const [k, exp] of this.used) if (exp < now) this.used.delete(k);
    if (this.used.has(runId)) return false;
    this.used.set(runId, now + ttl * 1000);
    return true;
  }
  async putScore(e: ScoreEntry) {
    const list = this.boards.get(e.board) ?? [];
    list.push(e);
    list.sort((a, b) => b.score - a.score);
    this.boards.set(e.board, list.slice(0, 500));
  }
  async top(board: string, limit: number) {
    return (this.boards.get(board) ?? []).slice(0, limit);
  }
  async rankOf(board: string, score: number) {
    const list = this.boards.get(board) ?? [];
    return list.filter((e) => e.score > score).length + 1;
  }
}

let store: ScoreStore | null = null;

export async function getStore(): Promise<ScoreStore> {
  if (store) return store;
  if (process.env.DDB_TABLE_NAME) {
    const { DynamoStore } = await import("./dynamoStore");
    store = new DynamoStore(process.env.DDB_TABLE_NAME, process.env.AWS_REGION ?? "ap-south-1");
  } else {
    store = new MemoryStore();
  }
  return store;
}

/** test hook */
export function __setStore(s: ScoreStore | null) {
  store = s;
}

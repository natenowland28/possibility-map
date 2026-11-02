import "server-only";
import { promises as fs } from "fs";
import path from "path";
import type { SessionRecord } from "@/lib/types";

/**
 * Participant sessions are stored as JSON.
 * - With UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or Vercel KV's
 *   KV_REST_API_URL + KV_REST_API_TOKEN) they go to Redis, which works on any host.
 * - Otherwise they are written to ./data/sessions on disk (fine for local use
 *   or a single small server).
 */

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const useRedis = Boolean(REDIS_URL && REDIS_TOKEN);

const DIR = process.env.VERCEL
  ? path.join("/tmp", "possibility-map")
  : path.join(process.cwd(), "data", "sessions");

const KEY = (id: string) => `pm:session:${id}`;
const INDEX = "pm:sessions";

async function redis<T = unknown>(command: (string | number)[]): Promise<T> {
  const res = await fetch(REDIS_URL!, {
    method: "POST",
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Storage error (${res.status})`);
  const json = (await res.json()) as { result: T };
  return json.result;
}

const safeId = (id: string) => id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);

export const storageMode = useRedis ? "redis" : "file";

export async function saveSession(record: SessionRecord) {
  const id = safeId(record.id);
  if (!id) throw new Error("Invalid session id");
  if (useRedis) {
    await redis(["SET", KEY(id), JSON.stringify(record)]);
    await redis(["SADD", INDEX, id]);
    return;
  }
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(path.join(DIR, `${id}.json`), JSON.stringify(record, null, 2), "utf8");
}

export async function getSession(id: string): Promise<SessionRecord | null> {
  const sid = safeId(id);
  if (useRedis) {
    const raw = await redis<string | null>(["GET", KEY(sid)]);
    return raw ? (JSON.parse(raw) as SessionRecord) : null;
  }
  try {
    return JSON.parse(await fs.readFile(path.join(DIR, `${sid}.json`), "utf8")) as SessionRecord;
  } catch {
    return null;
  }
}

export async function listSessions(): Promise<SessionRecord[]> {
  let records: SessionRecord[] = [];
  if (useRedis) {
    const ids = await redis<string[]>(["SMEMBERS", INDEX]);
    if (ids.length) {
      const raws = await redis<(string | null)[]>(["MGET", ...ids.map(KEY)]);
      records = raws.filter(Boolean).map((r) => JSON.parse(r!) as SessionRecord);
    }
  } else {
    try {
      const files = (await fs.readdir(DIR)).filter((f) => f.endsWith(".json"));
      records = await Promise.all(
        files.map(async (f) => JSON.parse(await fs.readFile(path.join(DIR, f), "utf8")) as SessionRecord),
      );
    } catch {
      records = [];
    }
  }
  return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function deleteSession(id: string) {
  const sid = safeId(id);
  if (useRedis) {
    await redis(["DEL", KEY(sid)]);
    await redis(["SREM", INDEX, sid]);
    return;
  }
  await fs.rm(path.join(DIR, `${sid}.json`), { force: true });
}

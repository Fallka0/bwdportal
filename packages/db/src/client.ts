import { drizzle } from "drizzle-orm/d1";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schema";

/** Asynchrone SQLite-Datenbank mit dem Portal-Schema: D1 im Betrieb, libSQL in den Tests. */
export type Db = BaseSQLiteDatabase<"async", unknown, typeof schema>;

/** Datenbank aus dem D1-Binding (Cloudflare). */
export function createDb(d1: Parameters<typeof drizzle>[0]): Db {
  return drizzle(d1, { schema }) as unknown as Db;
}

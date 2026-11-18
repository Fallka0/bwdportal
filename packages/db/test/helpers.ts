import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import type { Db } from "../src/client";
import * as schema from "../src/schema";
import { seedSql } from "../src/seed/build";

/** Frische In-Memory-Datenbank mit denselben Migrationen und demselben Seed wie D1. */
export async function testDb(): Promise<Db> {
  const client = createClient({ url: ":memory:" });
  const dir = resolve(import.meta.dirname, "../migrations");
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".sql")).sort()) {
    for (const stmt of readFileSync(resolve(dir, f), "utf8").split("--> statement-breakpoint")) if (stmt.trim()) await client.execute(stmt);
  }
  await client.executeMultiple(seedSql().replace("PRAGMA defer_foreign_keys = on;", "PRAGMA foreign_keys = off;"));
  await client.execute("PRAGMA foreign_keys = on");
  return drizzle(client, { schema }) as unknown as Db;
}

export const NOW = { date: "2026-10-26", time: "10:20", stamp: "2026-10-26T10:20" };

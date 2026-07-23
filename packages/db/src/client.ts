import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/** appが持つD1バインディングから、schema.tsに紐づいたDrizzleインスタンスを組み立てる。 */
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type Db = ReturnType<typeof createDb>;

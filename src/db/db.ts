import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

export let db: ReturnType<typeof drizzle> | null = null;
export let sqlClient: ReturnType<typeof postgres> | null = null;

if (connectionString && typeof connectionString === "string" && connectionString.trim() !== "" && connectionString !== "your_db_url_here") {
  try {
    sqlClient = postgres(connectionString, { connect_timeout: 5 });
    db = drizzle(sqlClient, { schema });
  } catch (err) {
    console.error("[TaskPilot DB] Failed to initialize PostgreSQL connection:", err);
    db = null;
    sqlClient = null;
  }
} else {
  console.log("[TaskPilot DB] DATABASE_URL is not configured. Database-dependent endpoints will return 503 Service Unavailable.");
}

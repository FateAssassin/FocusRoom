import "server-only";
import Database from "better-sqlite3";

const dbPath = process.env.DB_PATH || "/app/data/focusroom.db";

const db = new Database(dbPath);

export default db;
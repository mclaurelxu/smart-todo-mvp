import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

function resolveDbPath(): string {
  if (process.env.DB_PATH && process.env.DB_PATH.trim().length > 0) {
    return path.resolve(process.cwd(), process.env.DB_PATH);
  }
  return path.resolve(process.cwd(), "data", "smart_todo.db");
}

function ensureDbDirectory(dbPath: string): void {
  const dbDirectory = path.dirname(dbPath);
  if (!fs.existsSync(dbDirectory)) {
    fs.mkdirSync(dbDirectory, { recursive: true });
  }
}

export function getDb(): Database.Database {
  const dbPath = resolveDbPath();
  ensureDbDirectory(dbPath);
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");
  return db;
}

export function initializeDbConnection(): void {
  const db = getDb();
  db.prepare("SELECT 1").get();
  closeDb(db);
}

export function closeDb(db: Database.Database): void {
  db.close();
}


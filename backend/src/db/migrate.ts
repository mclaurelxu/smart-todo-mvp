import { closeDb, getDb } from "./db.js";
import { migrations } from "./migrations.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Direction = "up" | "down";

function ensureMigrationsTable(db: ReturnType<typeof getDb>): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function migrateUp(): void {
  const db = getDb();
  ensureMigrationsTable(db);
  const alreadyApplied = new Set(
    db.prepare("SELECT id FROM schema_migrations ORDER BY id ASC").all().map((row) => (row as { id: string }).id),
  );

  for (const migration of migrations) {
    if (alreadyApplied.has(migration.id)) {
      continue;
    }

    const transaction = db.transaction(() => {
      db.exec(migration.upSql);
      db.prepare("INSERT INTO schema_migrations (id) VALUES (?)").run(migration.id);
    });
    transaction();
    console.log(`Applied migration: ${migration.id}`);
  }

  closeDb(db);
}

export function migrateDown(): void {
  const db = getDb();
  ensureMigrationsTable(db);
  const latestApplied = db
    .prepare("SELECT id FROM schema_migrations ORDER BY applied_at DESC, id DESC LIMIT 1")
    .get() as { id: string } | undefined;

  if (!latestApplied) {
    console.log("No applied migrations to roll back.");
    closeDb(db);
    return;
  }

  const migration = migrations.find((item) => item.id === latestApplied.id);
  if (!migration) {
    closeDb(db);
    throw new Error(`Migration not found in code: ${latestApplied.id}`);
  }

  const transaction = db.transaction(() => {
    db.exec(migration.downSql);
    db.prepare("DELETE FROM schema_migrations WHERE id = ?").run(migration.id);
  });
  transaction();
  console.log(`Rolled back migration: ${migration.id}`);
  closeDb(db);
}

function parseDirection(): Direction {
  const arg = process.argv[2];
  if (arg === "up" || arg === "down") {
    return arg;
  }
  throw new Error('Usage: npm run db:migrate:up OR npm run db:migrate:down (internally uses "up"|"down")');
}

function run(): void {
  const direction = parseDirection();
  if (direction === "up") {
    migrateUp();
    return;
  }
  migrateDown();
}

const isEntrypoint = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;
if (isEntrypoint) {
  run();
}


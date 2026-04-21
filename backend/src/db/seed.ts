import crypto from "node:crypto";
import { closeDb, getDb } from "./db.js";

function seed(): void {
  const db = getDb();

  const seedTransaction = db.transaction(() => {
    db.prepare("DELETE FROM users WHERE email = ?").run("test.user@example.com");

    const userId = crypto.randomUUID();
    db.prepare(
      `
        INSERT INTO users (id, email, display_name)
        VALUES (?, ?, ?)
      `,
    ).run(userId, "test.user@example.com", "Test User");

    const insertTask = db.prepare(
      `
        INSERT INTO tasks (id, user_id, title, description, status, priority, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    );

    const now = new Date();
    insertTask.run(
      crypto.randomUUID(),
      userId,
      "Write MVP task APIs",
      "Implement POST /tasks and GET /tasks endpoints.",
      "todo",
      "high",
      new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
    );
    insertTask.run(
      crypto.randomUUID(),
      userId,
      "Hook up frontend task list",
      "Connect UI to fetch tasks from backend.",
      "in_progress",
      "medium",
      new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    );
    insertTask.run(
      crypto.randomUUID(),
      userId,
      "Add basic tests",
      "Cover migration and seed scripts with smoke checks.",
      "done",
      "low",
      null,
    );
  });
  seedTransaction();

  console.log("Seed complete: 1 user + 3 tasks created.");
  closeDb(db);
}

seed();


export type Migration = {
  id: string;
  upSql: string;
  downSql: string;
};

export const migrations: Migration[] = [
  {
    id: "001_create_users_and_tasks",
    upSql: `
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL CHECK (length(trim(display_name)) > 0),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK (email LIKE '%_@_%._%')
      );

      CREATE TABLE tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
        description TEXT,
        status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        due_date TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX idx_tasks_user_id ON tasks(user_id);
      CREATE INDEX idx_tasks_status ON tasks(status);
    `,
    downSql: `
      DROP INDEX IF EXISTS idx_tasks_status;
      DROP INDEX IF EXISTS idx_tasks_user_id;
      DROP TABLE IF EXISTS tasks;
      DROP TABLE IF EXISTS users;
    `,
  },
  {
    id: "002_add_users_password_hash",
    upSql: `
      ALTER TABLE users ADD COLUMN password_hash TEXT;
    `,
    downSql: `
      PRAGMA foreign_keys = OFF;

      CREATE TABLE users_backup (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL CHECK (length(trim(display_name)) > 0),
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CHECK (email LIKE '%_@_%._%')
      );

      INSERT INTO users_backup (id, email, display_name, created_at)
      SELECT id, email, display_name, created_at
      FROM users;

      DROP TABLE users;
      ALTER TABLE users_backup RENAME TO users;

      PRAGMA foreign_keys = ON;
    `,
  },
  {
    id: "003_add_tasks_effort",
    upSql: `
      ALTER TABLE tasks
      ADD COLUMN effort TEXT NOT NULL DEFAULT 'medium' CHECK (effort IN ('low', 'medium', 'high'));
    `,
    downSql: `
      PRAGMA foreign_keys = OFF;

      CREATE TABLE tasks_backup (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 200),
        description TEXT,
        status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
        due_date TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      INSERT INTO tasks_backup (id, user_id, title, description, status, priority, due_date, created_at, updated_at)
      SELECT id, user_id, title, description, status, priority, due_date, created_at, updated_at
      FROM tasks;

      DROP TABLE tasks;
      ALTER TABLE tasks_backup RENAME TO tasks;
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

      PRAGMA foreign_keys = ON;
    `,
  },
];


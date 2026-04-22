import { closeDb, getDb } from "../db/db.js";

export type ReminderDigest = {
  generatedAt: string;
  dueTodayCount: number;
  overdueCount: number;
};

export type ReminderNotifier = {
  notify: (digest: ReminderDigest) => Promise<void> | void;
};

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function collectReminderDigest(now: Date = new Date()): ReminderDigest {
  const db = getDb();
  try {
    const todayIso = toIsoDate(now);
    const dueTodayRow = db
      .prepare(
        `
          SELECT COUNT(*) as count
          FROM tasks
          WHERE status != 'done'
            AND due_date IS NOT NULL
            AND date(due_date) = date(?)
        `,
      )
      .get(todayIso) as { count: number };

    const overdueRow = db
      .prepare(
        `
          SELECT COUNT(*) as count
          FROM tasks
          WHERE status != 'done'
            AND due_date IS NOT NULL
            AND date(due_date) < date(?)
        `,
      )
      .get(todayIso) as { count: number };

    return {
      generatedAt: now.toISOString(),
      dueTodayCount: dueTodayRow.count,
      overdueCount: overdueRow.count,
    };
  } finally {
    closeDb(db);
  }
}

export async function runReminderSweep(notifier: ReminderNotifier, now: Date = new Date()): Promise<ReminderDigest> {
  const digest = collectReminderDigest(now);
  await notifier.notify(digest);
  return digest;
}


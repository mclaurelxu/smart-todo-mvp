import type { ReminderDigest, ReminderNotifier } from "./reminderService.js";

export class ConsoleReminderNotifier implements ReminderNotifier {
  notify(digest: ReminderDigest): void {
    console.log(
      `[reminders] generated_at=${digest.generatedAt} due_today=${digest.dueTodayCount} overdue=${digest.overdueCount}`,
    );
  }
}


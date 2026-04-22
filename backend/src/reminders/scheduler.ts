import type { ReminderNotifier } from "./reminderService.js";
import { runReminderSweep } from "./reminderService.js";

type SchedulerOptions = {
  intervalMs: number;
  runOnStart: boolean;
  notifier: ReminderNotifier;
};

export type ReminderScheduler = {
  stop: () => void;
};

export function startReminderScheduler(options: SchedulerOptions): ReminderScheduler {
  const runSweep = async () => {
    try {
      await runReminderSweep(options.notifier);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown reminder sweep error.";
      console.error(`[reminders] sweep_failed message="${message}"`);
    }
  };

  if (options.runOnStart) {
    void runSweep();
  }

  const timer = setInterval(() => {
    void runSweep();
  }, options.intervalMs);

  return {
    stop: () => {
      clearInterval(timer);
    },
  };
}


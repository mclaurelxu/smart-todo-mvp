import { ConsoleReminderNotifier } from "./notifiers.js";
import { runReminderSweep } from "./reminderService.js";

async function run(): Promise<void> {
  await runReminderSweep(new ConsoleReminderNotifier());
}

void run();


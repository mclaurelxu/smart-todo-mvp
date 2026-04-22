import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { initializeDbConnection } from "./db/db.js";
import { ConsoleReminderNotifier } from "./reminders/notifiers.js";
import { startReminderScheduler } from "./reminders/scheduler.js";

function startServer(): void {
  const env = loadEnv();
  initializeDbConnection();

  const app = createApp({ jwtSecret: env.jwtSecret, corsOrigin: env.corsOrigin });
  const scheduler = startReminderScheduler({
    intervalMs: env.reminderIntervalMs,
    runOnStart: env.reminderRunOnStart,
    notifier: new ConsoleReminderNotifier(),
  });

  const server = app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port} (${env.nodeEnv})`);
    console.log(`[reminders] scheduler_started interval_ms=${env.reminderIntervalMs}`);
  });

  const shutdown = () => {
    scheduler.stop();
    server.close();
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer();

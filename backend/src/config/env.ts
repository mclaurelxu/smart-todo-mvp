type Environment = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  jwtSecret: string;
  reminderIntervalMs: number;
  reminderRunOnStart: boolean;
  /** When set (e.g. staging UI origin), backend sends CORS headers for browser API calls. */
  corsOrigin: string | undefined;
};

function parsePort(rawPort: string | undefined): number {
  if (!rawPort) {
    return 4000;
  }

  const parsed = Number(rawPort);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    throw new Error("Invalid PORT. Must be an integer between 1 and 65535.");
  }
  return parsed;
}

function parseNodeEnv(rawNodeEnv: string | undefined): Environment["nodeEnv"] {
  const value = rawNodeEnv ?? "development";
  if (value === "development" || value === "test" || value === "production") {
    return value;
  }
  throw new Error("Invalid NODE_ENV. Must be development, test, or production.");
}

function parseReminderInterval(rawValue: string | undefined): number {
  if (!rawValue) {
    return 24 * 60 * 60 * 1000;
  }
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed < 60_000) {
    throw new Error("Invalid REMINDER_INTERVAL_MS. Must be an integer >= 60000.");
  }
  return parsed;
}

function parseOptionalOrigin(rawValue: string | undefined): string | undefined {
  if (!rawValue) {
    return undefined;
  }
  const trimmed = rawValue.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseReminderRunOnStart(rawValue: string | undefined): boolean {
  if (!rawValue) {
    return true;
  }
  const normalized = rawValue.trim().toLowerCase();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  throw new Error("Invalid REMINDER_RUN_ON_START. Must be true or false.");
}

export function loadEnv(): Environment {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim().length < 16) {
    throw new Error("Invalid JWT_SECRET. Must be set and at least 16 characters long.");
  }

  return {
    nodeEnv: parseNodeEnv(process.env.NODE_ENV),
    port: parsePort(process.env.PORT),
    jwtSecret,
    reminderIntervalMs: parseReminderInterval(process.env.REMINDER_INTERVAL_MS),
    reminderRunOnStart: parseReminderRunOnStart(process.env.REMINDER_RUN_ON_START),
    corsOrigin: parseOptionalOrigin(process.env.CORS_ORIGIN),
  };
}


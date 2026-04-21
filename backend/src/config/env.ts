type Environment = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  jwtSecret: string;
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

export function loadEnv(): Environment {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim().length < 16) {
    throw new Error("Invalid JWT_SECRET. Must be set and at least 16 characters long.");
  }

  return {
    nodeEnv: parseNodeEnv(process.env.NODE_ENV),
    port: parsePort(process.env.PORT),
    jwtSecret,
  };
}


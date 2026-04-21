import { createApp } from "./app.js";
import { loadEnv } from "./config/env.js";
import { initializeDbConnection } from "./db/db.js";

function startServer(): void {
  const env = loadEnv();
  initializeDbConnection();

  const app = createApp({ jwtSecret: env.jwtSecret });
  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

startServer();

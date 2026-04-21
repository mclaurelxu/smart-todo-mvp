import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { createAuthRouter } from "./routes/auth.js";
import { createTasksRouter } from "./routes/tasks.js";

type AppDependencies = {
  jwtSecret: string;
};

export function createApp({ jwtSecret }: AppDependencies) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });
  app.use(createAuthRouter(jwtSecret));
  app.use(createTasksRouter(jwtSecret));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}


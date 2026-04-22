import express from "express";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { createAuthRouter } from "./routes/auth.js";
import { createTasksRouter } from "./routes/tasks.js";

type AppDependencies = {
  jwtSecret: string;
  corsOrigin?: string;
};

export function createApp({ jwtSecret, corsOrigin }: AppDependencies) {
  const app = express();

  if (corsOrigin) {
    app.use((req, res, next) => {
      res.setHeader("Access-Control-Allow-Origin", corsOrigin);
      res.setHeader("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
      }
      next();
    });
  }

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


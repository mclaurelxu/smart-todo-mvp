import crypto from "node:crypto";
import { Router } from "express";
import { closeDb, getDb } from "../db/db.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
import { computeSmartScore } from "../tasks/smartScore.js";

const TASK_STATUSES = ["todo", "in_progress", "done"] as const;
const TASK_PRIORITIES = ["low", "medium", "high"] as const;
const TASK_EFFORTS = ["low", "medium", "high"] as const;

type TaskStatus = (typeof TASK_STATUSES)[number];
type TaskPriority = (typeof TASK_PRIORITIES)[number];
type TaskEffort = (typeof TASK_EFFORTS)[number];

type TaskRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  effort: TaskEffort;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

function assertAuthenticated(req: AuthenticatedRequest): { id: string } {
  if (!req.user) {
    throw new ApiError(401, "UNAUTHORIZED", "Invalid authentication state.");
  }
  return { id: req.user.id };
}

function validateTaskStatus(status: unknown): TaskStatus {
  if (typeof status !== "string" || !TASK_STATUSES.includes(status as TaskStatus)) {
    throw new ApiError(400, "BAD_REQUEST", "Status must be one of: todo, in_progress, done.");
  }
  return status as TaskStatus;
}

function validateTaskPriority(priority: unknown): TaskPriority {
  if (typeof priority !== "string" || !TASK_PRIORITIES.includes(priority as TaskPriority)) {
    throw new ApiError(400, "BAD_REQUEST", "Priority must be one of: low, medium, high.");
  }
  return priority as TaskPriority;
}

function validateTaskEffort(effort: unknown): TaskEffort {
  if (typeof effort !== "string" || !TASK_EFFORTS.includes(effort as TaskEffort)) {
    throw new ApiError(400, "BAD_REQUEST", "Effort must be one of: low, medium, high.");
  }
  return effort as TaskEffort;
}

function validateTaskTitle(title: unknown): string {
  if (typeof title !== "string" || title.trim().length === 0 || title.trim().length > 200) {
    throw new ApiError(400, "BAD_REQUEST", "Title is required and must be 1-200 characters.");
  }
  return title.trim();
}

function mapTask(task: TaskRow) {
  return {
    id: task.id,
    userId: task.user_id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    effort: task.effort,
    dueDate: task.due_date,
    createdAt: task.created_at,
    updatedAt: task.updated_at,
  };
}

export function createTasksRouter(jwtSecret: string): Router {
  const router = Router();
  router.use(requireAuth(jwtSecret));

  router.get("/tasks", (req, res, next) => {
    const db = getDb();
    try {
      const auth = assertAuthenticated(req as AuthenticatedRequest);
      const tasks = db
        .prepare(
          "SELECT id, user_id, title, description, status, priority, effort, due_date, created_at, updated_at FROM tasks WHERE user_id = ? ORDER BY created_at DESC",
        )
        .all(auth.id) as TaskRow[];
      res.status(200).json({ tasks: tasks.map(mapTask) });
    } catch (error) {
      next(error);
    } finally {
      closeDb(db);
    }
  });

  router.post("/tasks", (req, res, next) => {
    const db = getDb();
    try {
      const auth = assertAuthenticated(req as AuthenticatedRequest);
      const title = validateTaskTitle(req.body?.title);
      const description =
        req.body?.description === undefined || req.body?.description === null
          ? null
          : String(req.body.description).trim();
      const status = req.body?.status === undefined ? "todo" : validateTaskStatus(req.body.status);
      const priority = req.body?.priority === undefined ? "medium" : validateTaskPriority(req.body.priority);
      const effort = req.body?.effort === undefined ? "medium" : validateTaskEffort(req.body.effort);
      const dueDate = req.body?.dueDate === undefined || req.body?.dueDate === null ? null : String(req.body.dueDate);

      const id = crypto.randomUUID();
      db.prepare(
        `
        INSERT INTO tasks (id, user_id, title, description, status, priority, effort, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      ).run(id, auth.id, title, description, status, priority, effort, dueDate);

      const created = db
        .prepare(
          "SELECT id, user_id, title, description, status, priority, effort, due_date, created_at, updated_at FROM tasks WHERE id = ?",
        )
        .get(id) as TaskRow;
      res.status(201).json({ task: mapTask(created) });
    } catch (error) {
      next(error);
    } finally {
      closeDb(db);
    }
  });

  router.patch("/tasks/:id", (req, res, next) => {
    const db = getDb();
    try {
      const auth = assertAuthenticated(req as AuthenticatedRequest);
      const taskId = req.params.id;

      const existing = db
        .prepare(
          "SELECT id, user_id, title, description, status, priority, effort, due_date, created_at, updated_at FROM tasks WHERE id = ?",
        )
        .get(taskId) as TaskRow | undefined;
      if (!existing || existing.user_id !== auth.id) {
        throw new ApiError(404, "NOT_FOUND", "Task not found.");
      }

      const nextTitle = req.body?.title === undefined ? existing.title : validateTaskTitle(req.body.title);
      const nextDescription =
        req.body?.description === undefined
          ? existing.description
          : req.body.description === null
            ? null
            : String(req.body.description).trim();
      const nextStatus = req.body?.status === undefined ? existing.status : validateTaskStatus(req.body.status);
      const nextPriority =
        req.body?.priority === undefined ? existing.priority : validateTaskPriority(req.body.priority);
      const nextEffort = req.body?.effort === undefined ? existing.effort : validateTaskEffort(req.body.effort);
      const nextDueDate =
        req.body?.dueDate === undefined ? existing.due_date : req.body.dueDate === null ? null : String(req.body.dueDate);

      db.prepare(
        `
        UPDATE tasks
        SET title = ?, description = ?, status = ?, priority = ?, effort = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      ).run(nextTitle, nextDescription, nextStatus, nextPriority, nextEffort, nextDueDate, taskId);

      const updated = db
        .prepare(
          "SELECT id, user_id, title, description, status, priority, effort, due_date, created_at, updated_at FROM tasks WHERE id = ?",
        )
        .get(taskId) as TaskRow;
      res.status(200).json({ task: mapTask(updated) });
    } catch (error) {
      next(error);
    } finally {
      closeDb(db);
    }
  });

  router.delete("/tasks/:id", (req, res, next) => {
    const db = getDb();
    try {
      const auth = assertAuthenticated(req as AuthenticatedRequest);
      const taskId = req.params.id;

      const existing = db.prepare("SELECT id, user_id FROM tasks WHERE id = ?").get(taskId) as
        | { id: string; user_id: string }
        | undefined;
      if (!existing || existing.user_id !== auth.id) {
        throw new ApiError(404, "NOT_FOUND", "Task not found.");
      }

      db.prepare("DELETE FROM tasks WHERE id = ?").run(taskId);
      res.status(204).send();
    } catch (error) {
      next(error);
    } finally {
      closeDb(db);
    }
  });

  router.get("/tasks/today", (req, res, next) => {
    const db = getDb();
    try {
      const auth = assertAuthenticated(req as AuthenticatedRequest);
      const tasks = db
        .prepare(
          "SELECT id, user_id, title, description, status, priority, effort, due_date, created_at, updated_at FROM tasks WHERE user_id = ? AND status != 'done'",
        )
        .all(auth.id) as TaskRow[];

      const now = new Date();
      const scored = tasks
        .map((task) => ({
          task,
          smartScore: computeSmartScore({ priority: task.priority, dueDate: task.due_date, effort: task.effort }, now),
        }))
        .sort((a, b) => b.smartScore - a.smartScore);

      res.status(200).json({
        tasks: scored.map((item) => ({
          ...mapTask(item.task),
          smartScore: item.smartScore,
        })),
      });
    } catch (error) {
      next(error);
    } finally {
      closeDb(db);
    }
  });

  return router;
}


import crypto from "node:crypto";
import { Router } from "express";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { signAuthToken } from "../auth/jwt.js";
import { getDb, closeDb } from "../db/db.js";
import { ApiError } from "../middleware/errorHandler.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";

type UserRow = {
  id: string;
  email: string;
  display_name: string;
  password_hash: string | null;
  created_at: string;
};

function validateEmail(email: unknown): string {
  if (typeof email !== "string" || !email.includes("@")) {
    throw new ApiError(400, "BAD_REQUEST", "A valid email is required.");
  }
  return email.trim().toLowerCase();
}

function validatePassword(password: unknown): string {
  if (typeof password !== "string" || password.length < 8) {
    throw new ApiError(400, "BAD_REQUEST", "Password must be at least 8 characters.");
  }
  return password;
}

function validateDisplayName(displayName: unknown): string {
  if (typeof displayName !== "string" || displayName.trim().length < 1) {
    throw new ApiError(400, "BAD_REQUEST", "Display name is required.");
  }
  return displayName.trim();
}

export function createAuthRouter(jwtSecret: string): Router {
  const router = Router();

  router.post("/auth/signup", (req, res, next) => {
    const db = getDb();
    try {
      const email = validateEmail(req.body?.email);
      const password = validatePassword(req.body?.password);
      const displayName = validateDisplayName(req.body?.displayName);

      const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
      if (existing) {
        throw new ApiError(409, "EMAIL_IN_USE", "An account with this email already exists.");
      }

      const id = crypto.randomUUID();
      const passwordHash = hashPassword(password);
      db.prepare("INSERT INTO users (id, email, display_name, password_hash) VALUES (?, ?, ?, ?)").run(
        id,
        email,
        displayName,
        passwordHash,
      );
      const created = db
        .prepare("SELECT id, email, display_name, created_at FROM users WHERE id = ?")
        .get(id) as Omit<UserRow, "password_hash">;

      res.status(201).json({
        user: {
          id: created.id,
          email: created.email,
          displayName: created.display_name,
          createdAt: created.created_at,
        },
      });
    } catch (error) {
      next(error);
    } finally {
      closeDb(db);
    }
  });

  router.post("/auth/login", (req, res, next) => {
    const db = getDb();
    try {
      const email = validateEmail(req.body?.email);
      const password = validatePassword(req.body?.password);

      const user = db
        .prepare("SELECT id, email, password_hash FROM users WHERE email = ?")
        .get(email) as Pick<UserRow, "id" | "email" | "password_hash"> | undefined;

      if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
        throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
      }

      const token = signAuthToken({ sub: user.id, email: user.email }, jwtSecret);
      res.status(200).json({ token });
    } catch (error) {
      next(error);
    } finally {
      closeDb(db);
    }
  });

  router.get("/me", requireAuth(jwtSecret), (req, res, next) => {
    const db = getDb();
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        throw new ApiError(401, "UNAUTHORIZED", "Invalid authentication state.");
      }

      const user = db
        .prepare("SELECT id, email, display_name, created_at FROM users WHERE id = ?")
        .get(authReq.user.id) as Omit<UserRow, "password_hash"> | undefined;

      if (!user) {
        throw new ApiError(401, "UNAUTHORIZED", "User not found for provided token.");
      }

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          createdAt: user.created_at,
        },
      });
    } catch (error) {
      next(error);
    } finally {
      closeDb(db);
    }
  });

  return router;
}


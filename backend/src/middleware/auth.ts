import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../auth/jwt.js";
import { ApiError } from "./errorHandler.js";

export type AuthenticatedUser = {
  id: string;
  email: string;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

export function requireAuth(jwtSecret: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const authHeader = req.header("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      next(new ApiError(401, "UNAUTHORIZED", "Missing or invalid authorization header."));
      return;
    }

    const token = authHeader.slice("Bearer ".length).trim();
    try {
      const payload = verifyAuthToken(token, jwtSecret);
      (req as AuthenticatedRequest).user = { id: payload.sub, email: payload.email };
      next();
    } catch {
      next(new ApiError(401, "UNAUTHORIZED", "Invalid or expired token."));
    }
  };
}


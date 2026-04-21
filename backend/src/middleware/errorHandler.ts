import type { ErrorRequestHandler, RequestHandler } from "express";

type ErrorResponseBody = {
  error: {
    code: string;
    message: string;
  };
};

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new ApiError(404, "NOT_FOUND", "Route not found."));
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode = error instanceof ApiError ? error.statusCode : 500;
  const code = error instanceof ApiError ? error.code : "INTERNAL_SERVER_ERROR";
  const message = error instanceof ApiError ? error.message : "Unexpected server error.";

  const body: ErrorResponseBody = {
    error: {
      code,
      message,
    },
  };

  res.status(statusCode).json(body);
};


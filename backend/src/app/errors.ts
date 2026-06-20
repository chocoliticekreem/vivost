import { ZodError } from "zod";
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../core";
import type { FastifyInstance } from "fastify";

export interface HttpError {
  status: number;
  body: { error: { code: string; message: string } };
}

/**
 * Maps any thrown value to an HTTP status + error body. Core AppError subclasses
 * map by type; zod validation errors map to 400; everything else is a generic
 * 500 that never leaks internals.
 */
export function toHttp(err: unknown): HttpError {
  if (err instanceof NotFoundError) {
    return { status: 404, body: { error: { code: err.code, message: err.message } } };
  }
  if (err instanceof ValidationError) {
    return { status: 400, body: { error: { code: err.code, message: err.message } } };
  }
  if (err instanceof ConflictError) {
    return { status: 409, body: { error: { code: err.code, message: err.message } } };
  }
  if (err instanceof ForbiddenError) {
    return { status: 403, body: { error: { code: err.code, message: err.message } } };
  }
  if (err instanceof ZodError) {
    return {
      status: 400,
      body: { error: { code: "validation_error", message: err.message } },
    };
  }
  if (err instanceof AppError) {
    return { status: 400, body: { error: { code: err.code, message: err.message } } };
  }
  return {
    status: 500,
    body: { error: { code: "internal_error", message: "Internal server error" } },
  };
}

/**
 * Installs toHttp as Fastify's error handler so any error thrown in a route
 * handler is serialised to the standard error body shape.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((err, _req, reply) => {
    const { status, body } = toHttp(err);
    void reply.status(status).send(body);
  });
}

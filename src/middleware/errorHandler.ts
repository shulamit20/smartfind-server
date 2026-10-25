import { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors';

// Every error leaves the server in the same shape:
// { "error": { "code": "...", "message": "...", "details": [] } }
// Stack traces and database errors are never sent to the client.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }

  // zod validation failed (body, query or path params)
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details } });
    return;
  }

  // Invalid JSON in the request body
  if (err?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body', details: [] } });
    return;
  }

  // Unique constraint in the database (e.g. a lookup name that already exists)
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json({ error: { code: 'CONFLICT', message: 'This value already exists', details: [] } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong', details: [] } });
};

export const notFoundRoute: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found', details: [] } });
};

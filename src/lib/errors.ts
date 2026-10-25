// An error with an HTTP status. Services throw these; the error handler turns them into JSON.
export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details: unknown[] = [],
  ) {
    super(message);
  }
}

export const badRequest = (message: string, details: unknown[] = []) =>
  new AppError(400, 'VALIDATION_ERROR', message, details);
export const unauthorized = (message = 'You must be logged in') => new AppError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'You do not have permission to do this') =>
  new AppError(403, 'FORBIDDEN', message);
export const notFound = (what = 'Resource') => new AppError(404, 'NOT_FOUND', `${what} not found`);
export const conflict = (message: string) => new AppError(409, 'CONFLICT', message);

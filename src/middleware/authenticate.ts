import { Request, RequestHandler } from 'express';
import { verifyToken } from '../lib/jwt';
import { unauthorized } from '../lib/errors';

// Reads "Authorization: Bearer <token>", verifies it and sets req.user = { id, role }.
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(unauthorized());
  }
  try {
    const { userId, role } = verifyToken(header.slice('Bearer '.length));
    req.user = { id: userId, role };
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
};

// The logged-in user inside a controller (routes using this are always behind `authenticate`)
export function getUser(req: Request) {
  if (!req.user) throw unauthorized();
  return req.user;
}

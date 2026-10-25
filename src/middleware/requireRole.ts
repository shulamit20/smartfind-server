import { RequestHandler } from 'express';
import { Role } from '../config/constants';
import { forbidden, unauthorized } from '../lib/errors';

// Allows the request only if the logged-in user's role (taken from the JWT) is in the list.
export const requireRole =
  (...roles: Role[]): RequestHandler =>
  (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };

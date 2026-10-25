import { CurrentUser } from './currentUser';

// Adds `req.user` (set by the authenticate middleware) to Express's Request type
declare global {
  namespace Express {
    interface Request {
      user?: CurrentUser;
    }
  }
}

export {};

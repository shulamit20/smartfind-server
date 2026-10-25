import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// Limits login/register attempts per IP to slow down password guessing
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many attempts, try again later', details: [] } },
});

import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authRateLimit } from '../../middleware/rateLimit';
import * as authController from './auth.controller';

// Mounted at /api/auth
const router = Router();

router.post('/register', authRateLimit, authController.register);
router.post('/login', authRateLimit, authController.login);
router.get('/me', authenticate, authController.me);

export default router;

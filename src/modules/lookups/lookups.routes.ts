import { Router } from 'express';
import { requireRole } from '../../middleware/requireRole';
import { Role } from '../../config/constants';
import * as lookupsController from './lookups.controller';

// Mounted at /api/lookups (behind `authenticate`)
const router = Router();

router.get('/', lookupsController.getAll);
router.post('/:type', requireRole(Role.Admin), lookupsController.create);
router.delete('/:type/:id', requireRole(Role.Admin), lookupsController.remove);

export default router;

import { Router } from 'express';
import { requireRole } from '../../middleware/requireRole';
import { Role } from '../../config/constants';
import * as foundItemsController from './foundItems.controller';

// Mounted at /api/found-items (behind `authenticate`)
const router = Router();

router.get('/', foundItemsController.list);
router.get('/:id', foundItemsController.getById);
router.post('/', requireRole(Role.Admin), foundItemsController.create);
router.put('/:id', requireRole(Role.Admin), foundItemsController.update);
router.delete('/:id', requireRole(Role.Admin), foundItemsController.remove);

export default router;

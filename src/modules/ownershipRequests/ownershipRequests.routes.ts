import { Router } from 'express';
import { requireRole } from '../../middleware/requireRole';
import { Role } from '../../config/constants';
import * as ownershipRequestsController from './ownershipRequests.controller';

// Mounted at /api/ownership-requests (behind `authenticate`)
const router = Router();

router.post('/', requireRole(Role.User), ownershipRequestsController.create);
router.get('/', ownershipRequestsController.list);
router.get('/:id', ownershipRequestsController.getById);
router.patch('/:id/approve', requireRole(Role.Admin), ownershipRequestsController.approve);
router.patch('/:id/reject', requireRole(Role.Admin), ownershipRequestsController.reject);

export default router;

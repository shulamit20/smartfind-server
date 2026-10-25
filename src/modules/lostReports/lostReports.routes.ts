import { Router } from 'express';
import { requireRole } from '../../middleware/requireRole';
import { Role } from '../../config/constants';
import * as lostReportsController from './lostReports.controller';

// Mounted at /api/lost-reports (behind `authenticate`).
// Ownership (own report vs. admin) is checked in the service.
const router = Router();

router.get('/', lostReportsController.list);
router.get('/:id', lostReportsController.getById);
router.get('/:id/matches', lostReportsController.getMatches);
router.post('/', requireRole(Role.User), lostReportsController.create);
router.put('/:id', lostReportsController.update);
router.delete('/:id', lostReportsController.remove);

export default router;

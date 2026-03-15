import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import { listUsers, approveUser, rejectUser } from '../controllers/admin.controller';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/users', listUsers);
router.patch('/users/:id/approve', approveUser);
router.patch('/users/:id/reject', rejectUser);

export default router;

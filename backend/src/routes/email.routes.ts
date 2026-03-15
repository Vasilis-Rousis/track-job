import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { scheduleEmail, listEmails, cancelEmail } from '../controllers/email.controller';
import { scheduleEmailSchema } from '../schemas/email.schema';

const router = Router();

router.use(authenticate);

router.post('/', validate(scheduleEmailSchema), asyncHandler(scheduleEmail));
router.get('/', asyncHandler(listEmails));
router.delete('/:id', asyncHandler(cancelEmail));

export default router;

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { asyncHandler } from '../middleware/asyncHandler';
import { scheduleEmail, listEmails, deleteEmail, updateEmail } from '../controllers/email.controller';
import { scheduleEmailSchema, updateEmailSchema } from '../schemas/email.schema';

const router = Router();

router.use(authenticate);

router.post('/', validate(scheduleEmailSchema), asyncHandler(scheduleEmail));
router.get('/', asyncHandler(listEmails));
router.patch('/:id', validate(updateEmailSchema), asyncHandler(updateEmail));
router.delete('/:id', asyncHandler(deleteEmail));

export default router;

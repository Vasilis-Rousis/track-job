import { Router } from 'express';
import {
  listApplications,
  createApplication,
  getApplication,
  updateApplication,
  deleteApplication,
} from '../controllers/applications.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createApplicationSchema,
  updateApplicationSchema,
} from '../schemas/application.schema';

const router = Router();

router.use(authenticate);

router.get('/', listApplications);
router.post('/', validate(createApplicationSchema), createApplication);
router.get('/:id', getApplication);
router.patch('/:id', validate(updateApplicationSchema), updateApplication);
router.delete('/:id', deleteApplication);

export default router;

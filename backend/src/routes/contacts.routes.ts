import { Router } from 'express';
import {
  listContacts,
  createContact,
  updateContact,
  deleteContact,
} from '../controllers/contacts.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createContactSchema,
  updateContactSchema,
} from '../schemas/contact.schema';

const router = Router();

router.use(authenticate);

router.get('/', listContacts);
router.post('/', validate(createContactSchema), createContact);
router.patch('/:id', validate(updateContactSchema), updateContact);
router.delete('/:id', deleteContact);

export default router;

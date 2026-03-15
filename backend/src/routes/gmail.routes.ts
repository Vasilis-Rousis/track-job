import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';
import {
  getAuthUrl,
  handleCallback,
  getStatus,
  disconnect,
} from '../controllers/gmail.controller';

const router = Router();

router.get('/url', authenticate, asyncHandler(getAuthUrl));
router.get('/callback', asyncHandler(handleCallback));
router.get('/status', authenticate, asyncHandler(getStatus));
router.delete('/disconnect', authenticate, asyncHandler(disconnect));

export default router;

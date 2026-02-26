import { Router } from 'express';
import * as controller from './users.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();

router.use(authenticate);

router.get('/pending', authorize('admin'), controller.getPendingUsers);
router.patch('/:id/approve', authorize('admin'), controller.approveUser);
router.patch('/:id/reject', authorize('admin'), controller.rejectUser);
router.get('/search', controller.searchUsers);

export default router;

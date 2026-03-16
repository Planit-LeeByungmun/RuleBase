import { Router } from 'express';
import * as controller from './inquiries.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', controller.getInquiries);
router.get('/:id', controller.getInquiry);
router.post('/', controller.createInquiry);
router.patch('/:id', controller.updateInquiry);
router.post('/:id/answers', controller.createAnswer);
router.patch('/:id/answers/:answerId', controller.updateAnswer);
router.delete('/:id/answers/:answerId', controller.deleteAnswer);
router.patch('/:id/resolve', controller.toggleResolve);
router.delete('/:id', controller.deleteInquiry);

export default router;

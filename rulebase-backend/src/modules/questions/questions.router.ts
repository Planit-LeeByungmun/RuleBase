import { Router } from 'express';
import * as controller from './questions.controller';
import { authenticate } from '../../middleware/authenticate';

const router = Router();
router.use(authenticate);

router.get('/', controller.getQuestions);
router.get('/unresolved-counts', controller.getUnresolvedCounts);
router.post('/', controller.createQuestion);
router.post('/:id/answers', controller.createAnswer);
router.patch('/:id/resolve', controller.resolveQuestion);

export default router;

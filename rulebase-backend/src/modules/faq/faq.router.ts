import { Router } from 'express';
import * as controller from './faq.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/categories', controller.getCategories);
router.post('/categories', authorize('admin'), controller.createCategory);
router.patch('/categories/:id', authorize('admin'), controller.updateCategory);
router.delete('/categories/:id', authorize('admin'), controller.deleteCategory);
router.post('/items', authorize('admin'), controller.createItem);
router.patch('/items/:id', authorize('admin'), controller.updateItem);
router.delete('/items/:id', authorize('admin'), controller.deleteItem);

export default router;

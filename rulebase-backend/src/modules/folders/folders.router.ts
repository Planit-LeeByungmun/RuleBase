import { Router } from 'express';
import * as controller from './folders.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';

const router = Router();
router.use(authenticate);

router.get('/tree', controller.getFolderTree);
router.post('/', authorize('admin'), controller.createFolder);
router.patch('/:id', authorize('admin'), controller.updateFolder);
router.put('/reorder', authorize('admin'), controller.reorderFolders);
router.delete('/:id', authorize('admin'), controller.deleteFolder);
router.get('/:id/permissions', authorize('admin'), controller.getFolderPermissions);
router.put('/:id/permissions', authorize('admin'), controller.setFolderPermissions);

export default router;

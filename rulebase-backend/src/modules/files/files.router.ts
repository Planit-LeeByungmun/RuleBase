import { Router } from 'express';
import * as controller from './files.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { upload } from '../../middleware/upload';

const router = Router();
router.use(authenticate);

router.get('/', controller.getFilesInFolder);
router.get('/all', controller.getAllFiles);
router.post('/upload', upload.single('file'), controller.uploadFile);
router.get('/:id/download', controller.downloadFile);
router.get('/:id/view', controller.viewFile);
router.delete('/:id', authorize('admin'), controller.deleteFile);

export default router;

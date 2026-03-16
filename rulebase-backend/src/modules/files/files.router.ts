import { Router } from 'express';
import express from 'express';
import path from 'path';
import * as controller from './files.controller';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { upload } from '../../middleware/upload';
import * as filesService from './files.service';

const router = Router();
router.use(authenticate);

router.get('/', controller.getFilesInFolder);
router.get('/all', controller.getAllFiles);
router.post('/upload', authorize('admin'), upload.single('file'), controller.uploadFile);
router.get('/:id/download', controller.downloadFile);
router.get('/:id/view', controller.viewFile);
router.get('/:id/preview', controller.previewFile);
router.get('/:id/preview-assets/*', async (req, res, next) => {
  try {
    const fileId = parseInt(req.params.id, 10);
    const file = await filesService.getFileById(fileId);
    const baseName = path.parse(file.stored_name).name;
    const previewDir = path.join(__dirname, '../../../storage/previews', baseName);
    const assetPath = (req.params as Record<string, string>)[0];
    res.sendFile(path.join(previewDir, assetPath));
  } catch (err) {
    next(err);
  }
});
router.delete('/:id', authorize('admin'), controller.deleteFile);

export default router;

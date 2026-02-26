import { Request, Response, NextFunction } from 'express';
import * as filesService from './files.service';
import { AppError } from '../../shared/errors/AppError';
import path from 'path';
import fs from 'fs';

export async function getFilesInFolder(req: Request, res: Response, next: NextFunction) {
  try {
    const folderId = parseInt(req.query.folderId as string, 10);
    if (isNaN(folderId)) throw new AppError('folderId is required', 400);
    const files = await filesService.getFilesInFolder(folderId, req.user!.id, req.user!.role);
    res.json({ status: 'success', data: files });
  } catch (err) {
    next(err);
  }
}

export async function getAllFiles(req: Request, res: Response, next: NextFunction) {
  try {
    const files = await filesService.getAllFiles(req.user!.id, req.user!.role);
    res.json({ status: 'success', data: files });
  } catch (err) {
    next(err);
  }
}

export async function uploadFile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);
    const folderId = parseInt(req.body.folderId, 10);
    if (isNaN(folderId)) throw new AppError('folderId is required', 400);

    const file = await filesService.uploadFile({
      folderId,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      uploadedBy: req.user!.id,
    });
    res.status(201).json({ status: 'success', data: file });
  } catch (err) {
    next(err);
  }
}

export async function downloadFile(req: Request, res: Response, next: NextFunction) {
  try {
    const fileId = parseInt(req.params.id, 10);
    const file = await filesService.getFileById(fileId);
    const filePath = path.join(__dirname, '../../../storage/uploads', file.stored_name);

    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found on disk', 404);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Type', file.mime_type);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

export async function viewFile(req: Request, res: Response, next: NextFunction) {
  try {
    const fileId = parseInt(req.params.id, 10);
    const file = await filesService.getFileById(fileId);
    const filePath = path.join(__dirname, '../../../storage/uploads', file.stored_name);

    if (!fs.existsSync(filePath)) {
      throw new AppError('File not found on disk', 404);
    }

    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(file.original_name)}"`);
    res.setHeader('Content-Type', file.mime_type);
    res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
}

export async function deleteFile(req: Request, res: Response, next: NextFunction) {
  try {
    const fileId = parseInt(req.params.id, 10);
    await filesService.deleteFile(fileId);
    res.json({ status: 'success', message: 'File deleted' });
  } catch (err) {
    next(err);
  }
}

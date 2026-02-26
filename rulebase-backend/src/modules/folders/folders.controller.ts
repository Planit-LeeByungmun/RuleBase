import { Request, Response, NextFunction } from 'express';
import * as foldersService from './folders.service';

export async function getFolderTree(req: Request, res: Response, next: NextFunction) {
  try {
    const tree = await foldersService.getFolderTree(req.user!.id, req.user!.role);
    res.json({ status: 'success', data: tree });
  } catch (err) {
    next(err);
  }
}

export async function createFolder(req: Request, res: Response, next: NextFunction) {
  try {
    const folder = await foldersService.createFolder({
      ...req.body,
      createdBy: req.user!.id,
    });
    res.status(201).json({ status: 'success', data: folder });
  } catch (err) {
    next(err);
  }
}

export async function updateFolder(req: Request, res: Response, next: NextFunction) {
  try {
    const folder = await foldersService.updateFolder(parseInt(req.params.id, 10), req.body);
    res.json({ status: 'success', data: folder });
  } catch (err) {
    next(err);
  }
}

export async function deleteFolder(req: Request, res: Response, next: NextFunction) {
  try {
    await foldersService.deleteFolder(parseInt(req.params.id, 10));
    res.json({ status: 'success', message: 'Folder deleted' });
  } catch (err) {
    next(err);
  }
}

export async function setFolderPermissions(req: Request, res: Response, next: NextFunction) {
  try {
    const folderId = parseInt(req.params.id, 10);
    await foldersService.setFolderPermissions(folderId, req.body.permissions);
    res.json({ status: 'success', message: 'Permissions updated' });
  } catch (err) {
    next(err);
  }
}

export async function getFolderPermissions(req: Request, res: Response, next: NextFunction) {
  try {
    const folderId = parseInt(req.params.id, 10);
    const permissions = await foldersService.getFolderPermissions(folderId);
    res.json({ status: 'success', data: permissions });
  } catch (err) {
    next(err);
  }
}

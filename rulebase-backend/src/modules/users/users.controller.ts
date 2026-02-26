import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service';

export async function getPendingUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const users = await usersService.getPendingUsers();
    res.json({ status: 'success', data: users });
  } catch (err) {
    next(err);
  }
}

export async function approveUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = parseInt(req.params.id, 10);
    const adminId = req.user!.id;
    const user = await usersService.approveUser(userId, adminId);
    res.json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
}

export async function rejectUser(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await usersService.rejectUser(userId);
    res.json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
}

export async function searchUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.query.q as string) || '';
    const users = await usersService.searchUsers(query, req.user?.id);
    res.json({ status: 'success', data: users });
  } catch (err) {
    next(err);
  }
}

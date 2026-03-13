import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const [stats, recentFiles, recentQuestions] = await Promise.all([
      dashboardService.getDashboardStats(userId, userRole),
      dashboardService.getRecentFiles(userId, userRole),
      dashboardService.getRecentQuestions(userId, userRole),
    ]);

    res.json({
      status: 'success',
      data: { stats, recentFiles, recentQuestions },
    });
  } catch (err) {
    next(err);
  }
}

import { Request, Response, NextFunction } from 'express';
import * as dashboardService from './dashboard.service';

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const [stats, recentFiles, recentInquiries, faqCategories] = await Promise.all([
      dashboardService.getDashboardStats(userId, userRole),
      dashboardService.getRecentFiles(userId, userRole),
      dashboardService.getRecentInquiries(),
      dashboardService.getRecentFaqCategories(),
    ]);

    res.json({
      status: 'success',
      data: { stats, recentFiles, recentInquiries, faqCategories },
    });
  } catch (err) {
    next(err);
  }
}

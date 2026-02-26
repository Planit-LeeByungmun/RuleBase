import { Request, Response, NextFunction } from 'express';
import * as faqService from './faq.service';

export async function getCategories(req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await faqService.getCategoriesWithItems();
    res.json({ status: 'success', data: categories });
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await faqService.createCategory({ ...req.body, createdBy: req.user!.id });
    res.status(201).json({ status: 'success', data: category });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await faqService.updateCategory(parseInt(req.params.id, 10), req.body);
    res.json({ status: 'success', data: category });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req: Request, res: Response, next: NextFunction) {
  try {
    await faqService.deleteCategory(parseInt(req.params.id, 10));
    res.json({ status: 'success', message: 'Category deleted' });
  } catch (err) {
    next(err);
  }
}

export async function createItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await faqService.createItem({ ...req.body, createdBy: req.user!.id });
    res.status(201).json({ status: 'success', data: item });
  } catch (err) {
    next(err);
  }
}

export async function updateItem(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await faqService.updateItem(parseInt(req.params.id, 10), req.body);
    res.json({ status: 'success', data: item });
  } catch (err) {
    next(err);
  }
}

export async function deleteItem(req: Request, res: Response, next: NextFunction) {
  try {
    await faqService.deleteItem(parseInt(req.params.id, 10));
    res.json({ status: 'success', message: 'Item deleted' });
  } catch (err) {
    next(err);
  }
}

import { Request, Response, NextFunction } from 'express';
import * as inquiriesService from './inquiries.service';

export async function getInquiries(req: Request, res: Response, next: NextFunction) {
  try {
    const inquiries = await inquiriesService.getInquiries();
    res.json({ status: 'success', data: inquiries });
  } catch (err) {
    next(err);
  }
}

export async function getInquiry(req: Request, res: Response, next: NextFunction) {
  try {
    const inquiry = await inquiriesService.getInquiry(parseInt(req.params.id, 10));
    res.json({ status: 'success', data: inquiry });
  } catch (err) {
    next(err);
  }
}

export async function createInquiry(req: Request, res: Response, next: NextFunction) {
  try {
    const inquiry = await inquiriesService.createInquiry({
      title: req.body.title,
      body: req.body.body,
      askedBy: req.user!.id,
    });
    res.status(201).json({ status: 'success', data: inquiry });
  } catch (err) {
    next(err);
  }
}

export async function createAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const answer = await inquiriesService.createAnswer({
      inquiryId: parseInt(req.params.id, 10),
      body: req.body.body,
      answeredBy: req.user!.id,
    });
    res.status(201).json({ status: 'success', data: answer });
  } catch (err) {
    next(err);
  }
}

export async function updateInquiry(req: Request, res: Response, next: NextFunction) {
  try {
    const inquiry = await inquiriesService.updateInquiry(
      parseInt(req.params.id, 10),
      { title: req.body.title, body: req.body.body },
      req.user!.id,
      req.user!.role
    );
    res.json({ status: 'success', data: inquiry });
  } catch (err) {
    next(err);
  }
}

export async function deleteAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    await inquiriesService.deleteAnswer(
      parseInt(req.params.answerId, 10),
      req.user!.id,
      req.user!.role
    );
    res.json({ status: 'success', message: 'Answer deleted' });
  } catch (err) {
    next(err);
  }
}

export async function toggleResolve(req: Request, res: Response, next: NextFunction) {
  try {
    const inquiry = await inquiriesService.toggleResolve(
      parseInt(req.params.id, 10),
      req.user!.id,
      req.user!.role
    );
    res.json({ status: 'success', data: inquiry });
  } catch (err) {
    next(err);
  }
}

export async function updateAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const answer = await inquiriesService.updateAnswer(
      parseInt(req.params.answerId, 10),
      req.body.body,
      req.user!.id,
      req.user!.role
    );
    res.json({ status: 'success', data: answer });
  } catch (err) {
    next(err);
  }
}

export async function deleteInquiry(req: Request, res: Response, next: NextFunction) {
  try {
    await inquiriesService.deleteInquiry(
      parseInt(req.params.id, 10),
      req.user!.id,
      req.user!.role
    );
    res.json({ status: 'success', message: 'Inquiry deleted' });
  } catch (err) {
    next(err);
  }
}

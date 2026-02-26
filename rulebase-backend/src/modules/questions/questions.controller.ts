import { Request, Response, NextFunction } from 'express';
import * as questionsService from './questions.service';
import { AppError } from '../../shared/errors/AppError';

export async function getQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const fileId = parseInt(req.query.fileId as string, 10);
    if (isNaN(fileId)) throw new AppError('fileId is required', 400);
    const questions = await questionsService.getQuestions(fileId);
    res.json({ status: 'success', data: questions });
  } catch (err) {
    next(err);
  }
}

export async function createQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const question = await questionsService.createQuestion({
      fileId: req.body.fileId,
      askedBy: req.user!.id,
      body: req.body.body,
    });
    res.status(201).json({ status: 'success', data: question });
  } catch (err) {
    next(err);
  }
}

export async function createAnswer(req: Request, res: Response, next: NextFunction) {
  try {
    const questionId = parseInt(req.params.id, 10);
    const answer = await questionsService.createAnswer({
      questionId,
      answeredBy: req.user!.id,
      body: req.body.body,
    });
    res.status(201).json({ status: 'success', data: answer });
  } catch (err) {
    next(err);
  }
}

export async function resolveQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const questionId = parseInt(req.params.id, 10);
    const question = await questionsService.resolveQuestion(questionId, req.user!.id, req.user!.role);
    res.json({ status: 'success', data: question });
  } catch (err) {
    next(err);
  }
}

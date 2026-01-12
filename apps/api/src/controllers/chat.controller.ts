import type { Request, Response } from 'express';

import {
  createChatSessionSchema,
  updateChatSessionSchema,
  chatSessionIdParamSchema,
  listChatSessionsQuerySchema,
  sendMessageSchema,
} from '@myautowhiz/shared';

import { chatService } from '../services';
import { catchAsync } from '../middleware/errorHandler';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';

export const listSessions = catchAsync(async (req: Request, res: Response) => {
  const query = listChatSessionsQuerySchema.parse(req.query);
  const result = await chatService.listSessions(req.user!.id, query);
  sendSuccess(res, result);
});

export const getSession = catchAsync(async (req: Request, res: Response) => {
  const { id } = chatSessionIdParamSchema.parse(req.params);
  const session = await chatService.getSession(req.user!.id, id);
  sendSuccess(res, session);
});

export const createSession = catchAsync(async (req: Request, res: Response) => {
  const input = createChatSessionSchema.parse(req.body);
  const session = await chatService.createSession(req.user!.id, input);
  sendCreated(res, session);
});

export const updateSession = catchAsync(async (req: Request, res: Response) => {
  const { id } = chatSessionIdParamSchema.parse(req.params);
  const input = updateChatSessionSchema.parse(req.body);
  const session = await chatService.updateSession(req.user!.id, id, input);
  sendSuccess(res, session);
});

export const deleteSession = catchAsync(async (req: Request, res: Response) => {
  const { id } = chatSessionIdParamSchema.parse(req.params);
  await chatService.deleteSession(req.user!.id, id);
  sendNoContent(res);
});

export const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const { id } = chatSessionIdParamSchema.parse(req.params);
  const input = sendMessageSchema.parse(req.body);

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  try {
    for await (const chunk of chatService.sendMessage(req.user!.id, id, input)) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }
    res.write('data: [DONE]\n\n');
  } catch (error) {
    res.write(`data: ${JSON.stringify({ type: 'error', error: 'Stream error' })}\n\n`);
  }

  res.end();
});

export const getMessages = catchAsync(async (req: Request, res: Response) => {
  const { id } = chatSessionIdParamSchema.parse(req.params);
  const messages = await chatService.getMessages(req.user!.id, id);
  sendSuccess(res, messages);
});

import type { Request, Response } from 'express';

import {
  createDiagnosticSchema,
  updateDiagnosticSchema,
  diagnosticIdParamSchema,
  listDiagnosticsQuerySchema,
  addDiagnosticImageSchema,
  resolveDiagnosticSchema,
} from '@myautowhiz/shared';

import { diagnosticService } from '../services';
import { catchAsync } from '../middleware/errorHandler';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';

export const listDiagnostics = catchAsync(async (req: Request, res: Response) => {
  const query = listDiagnosticsQuerySchema.parse(req.query);
  const result = await diagnosticService.listDiagnostics(req.user!.id, query);
  sendSuccess(res, result);
});

export const getDiagnostic = catchAsync(async (req: Request, res: Response) => {
  const { id } = diagnosticIdParamSchema.parse(req.params);
  const diagnostic = await diagnosticService.getDiagnostic(req.user!.id, id);
  sendSuccess(res, diagnostic);
});

export const createDiagnostic = catchAsync(async (req: Request, res: Response) => {
  const input = createDiagnosticSchema.parse(req.body);
  const diagnostic = await diagnosticService.createDiagnostic(req.user!.id, input);
  sendCreated(res, diagnostic);
});

export const updateDiagnostic = catchAsync(async (req: Request, res: Response) => {
  const { id } = diagnosticIdParamSchema.parse(req.params);
  const input = updateDiagnosticSchema.parse(req.body);
  const diagnostic = await diagnosticService.updateDiagnostic(req.user!.id, id, input);
  sendSuccess(res, diagnostic);
});

export const addImage = catchAsync(async (req: Request, res: Response) => {
  const { id } = diagnosticIdParamSchema.parse(req.params);
  const input = addDiagnosticImageSchema.parse(req.body);
  const diagnostic = await diagnosticService.addImage(
    req.user!.id,
    id,
    input.imageUrl,
    input.description
  );
  sendSuccess(res, diagnostic);
});

export const analyze = catchAsync(async (req: Request, res: Response) => {
  const { id } = diagnosticIdParamSchema.parse(req.params);
  const diagnostic = await diagnosticService.analyze(req.user!.id, id);
  sendSuccess(res, diagnostic);
});

export const resolveDiagnostic = catchAsync(async (req: Request, res: Response) => {
  const { id } = diagnosticIdParamSchema.parse(req.params);
  const input = resolveDiagnosticSchema.parse(req.body);
  const diagnostic = await diagnosticService.resolveDiagnostic(
    req.user!.id,
    id,
    input.resolution,
    input.actualCost
  );
  sendSuccess(res, diagnostic);
});

export const deleteDiagnostic = catchAsync(async (req: Request, res: Response) => {
  const { id } = diagnosticIdParamSchema.parse(req.params);
  await diagnosticService.deleteDiagnostic(req.user!.id, id);
  sendNoContent(res);
});

export const uploadImages = catchAsync(async (req: Request, res: Response) => {
  const { id } = diagnosticIdParamSchema.parse(req.params);
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return sendSuccess(res, { message: 'No images uploaded' });
  }

  const diagnostic = await diagnosticService.uploadImages(req.user!.id, id, files);
  sendSuccess(res, diagnostic);
});

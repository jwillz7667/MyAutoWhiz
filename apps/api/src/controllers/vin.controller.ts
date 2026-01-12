import type { Request, Response } from 'express';

import { decodeVinSchema, vinParamSchema, vinLookupQuerySchema } from '@myautowhiz/shared';

import { vinService } from '../services';
import { catchAsync } from '../middleware/errorHandler';
import { sendSuccess } from '../utils/response';

export const decodeVin = catchAsync(async (req: Request, res: Response) => {
  const { vin } = decodeVinSchema.parse(req.body);
  const query = vinLookupQuerySchema.parse(req.query);

  const result = await vinService.decodeVin(vin, req.user?.id, {
    includeRecalls: query.includeRecalls,
    includeSafety: query.includeSafety,
    source: 'api',
  });

  sendSuccess(res, result);
});

export const getRecalls = catchAsync(async (req: Request, res: Response) => {
  const { vin } = vinParamSchema.parse(req.params);
  const result = await vinService.getRecalls(vin, req.user?.id);
  sendSuccess(res, result);
});

export const getSafetyRatings = catchAsync(async (req: Request, res: Response) => {
  const { vin } = vinParamSchema.parse(req.params);
  const result = await vinService.getSafetyRatings(vin, req.user?.id);
  sendSuccess(res, result);
});

export const getRecentLookups = catchAsync(async (req: Request, res: Response) => {
  const lookups = await vinService.getRecentLookups(req.user!.id);
  sendSuccess(res, lookups);
});

import type { Request, Response } from 'express';

import { updateProfileSchema, deleteAccountSchema } from '@myautowhiz/shared';

import { userService } from '../services';
import { catchAsync } from '../middleware/errorHandler';
import { sendSuccess, sendNoContent } from '../utils/response';

export const getProfile = catchAsync(async (req: Request, res: Response) => {
  const profile = await userService.getProfile(req.user!.id);
  sendSuccess(res, profile);
});

export const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const input = updateProfileSchema.parse(req.body);
  const profile = await userService.updateProfile(req.user!.id, {
    ...input,
    phone: input.phone ?? undefined, // Convert null to undefined
    avatarUrl: input.avatarUrl ?? undefined, // Convert null to undefined
  });
  sendSuccess(res, profile);
});

export const getUsage = catchAsync(async (req: Request, res: Response) => {
  const usage = await userService.getUsage(req.user!.id);
  sendSuccess(res, usage);
});

export const deleteAccount = catchAsync(async (req: Request, res: Response) => {
  const input = deleteAccountSchema.parse(req.body);
  await userService.deleteAccount(req.user!.id, input.password);
  sendNoContent(res);
});

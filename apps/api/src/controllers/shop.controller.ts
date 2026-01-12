import type { Request, Response } from 'express';

import { searchShopsSchema, shopIdParamSchema, contactShopSchema } from '@myautowhiz/shared';

import { shopService } from '../services';
import { catchAsync } from '../middleware/errorHandler';
import { sendSuccess, sendCreated } from '../utils/response';

export const searchShops = catchAsync(async (req: Request, res: Response) => {
  const params = searchShopsSchema.parse(req.query);
  const result = await shopService.searchShops(params);
  sendSuccess(res, result);
});

export const getShop = catchAsync(async (req: Request, res: Response) => {
  const { id } = shopIdParamSchema.parse(req.params);
  const shop = await shopService.getShopById(id);
  sendSuccess(res, shop);
});

export const contactShop = catchAsync(async (req: Request, res: Response) => {
  const { id } = shopIdParamSchema.parse(req.params);
  const input = contactShopSchema.parse(req.body);
  const contact = await shopService.contactShop(req.user!.id, id, {
    ...input,
    phone: input.phone ?? undefined, // Convert null to undefined
  });
  sendCreated(res, contact);
});

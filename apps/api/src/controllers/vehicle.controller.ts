import type { Request, Response } from 'express';

import {
  addVehicleSchema,
  updateVehicleSchema,
  vehicleIdParamSchema,
  listVehiclesQuerySchema,
  addMaintenanceRecordSchema,
} from '@myautowhiz/shared';

import { vehicleService } from '../services';
import { catchAsync } from '../middleware/errorHandler';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';

export const listVehicles = catchAsync(async (req: Request, res: Response) => {
  const query = listVehiclesQuerySchema.parse(req.query);
  const result = await vehicleService.listVehicles(req.user!.id, query.includeInactive);
  sendSuccess(res, result);
});

export const getVehicle = catchAsync(async (req: Request, res: Response) => {
  const { id } = vehicleIdParamSchema.parse(req.params);
  const vehicle = await vehicleService.getVehicle(req.user!.id, id);
  sendSuccess(res, vehicle);
});

export const addVehicle = catchAsync(async (req: Request, res: Response) => {
  const input = addVehicleSchema.parse(req.body);
  const vehicle = await vehicleService.addVehicle(req.user!.id, input);
  sendCreated(res, vehicle);
});

export const updateVehicle = catchAsync(async (req: Request, res: Response) => {
  const { id } = vehicleIdParamSchema.parse(req.params);
  const input = updateVehicleSchema.parse(req.body);
  const vehicle = await vehicleService.updateVehicle(req.user!.id, id, input);
  sendSuccess(res, vehicle);
});

export const deleteVehicle = catchAsync(async (req: Request, res: Response) => {
  const { id } = vehicleIdParamSchema.parse(req.params);
  await vehicleService.deleteVehicle(req.user!.id, id);
  sendNoContent(res);
});

export const refreshRecalls = catchAsync(async (req: Request, res: Response) => {
  const { id } = vehicleIdParamSchema.parse(req.params);
  const vehicle = await vehicleService.refreshRecalls(req.user!.id, id);
  sendSuccess(res, vehicle);
});

export const getMaintenanceRecords = catchAsync(async (req: Request, res: Response) => {
  const { id } = vehicleIdParamSchema.parse(req.params);
  const records = await vehicleService.getMaintenanceRecords(req.user!.id, id);
  sendSuccess(res, records);
});

export const addMaintenanceRecord = catchAsync(async (req: Request, res: Response) => {
  const { id } = vehicleIdParamSchema.parse(req.params);
  const input = addMaintenanceRecordSchema.parse(req.body);
  const record = await vehicleService.addMaintenanceRecord(req.user!.id, id, input);
  sendCreated(res, record);
});

export const deleteMaintenanceRecord = catchAsync(async (req: Request, res: Response) => {
  const { id: vehicleId } = vehicleIdParamSchema.parse(req.params);
  const recordId = req.params.recordId;
  await vehicleService.deleteMaintenanceRecord(req.user!.id, vehicleId, recordId);
  sendNoContent(res);
});

export const getRecalls = catchAsync(async (req: Request, res: Response) => {
  const { id } = vehicleIdParamSchema.parse(req.params);
  const recalls = await vehicleService.getRecalls(req.user!.id, id);
  sendSuccess(res, recalls);
});

export const getSafetyRatings = catchAsync(async (req: Request, res: Response) => {
  const { id } = vehicleIdParamSchema.parse(req.params);
  const ratings = await vehicleService.getSafetyRatings(req.user!.id, id);
  sendSuccess(res, ratings);
});

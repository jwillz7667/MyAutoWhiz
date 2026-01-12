import { z } from 'zod';

import { vinSchema, mileageSchema, priceSchema, uuidSchema, paginationSchema } from './common';

export const addVehicleSchema = z.object({
  vin: vinSchema,
  nickname: z
    .string()
    .min(1, 'Nickname must be at least 1 character')
    .max(50, 'Nickname cannot exceed 50 characters')
    .trim()
    .optional(),
  currentMileage: mileageSchema,
  purchaseDate: z.coerce.date().optional().nullable(),
  purchasePrice: priceSchema,
  licensePlate: z.string().max(15).optional().nullable(),
  exteriorColor: z.string().max(50).optional().nullable(),
  interiorColor: z.string().max(50).optional().nullable(),
});

export type AddVehicleInput = z.infer<typeof addVehicleSchema>;

export const updateVehicleSchema = z.object({
  nickname: z
    .string()
    .min(1, 'Nickname must be at least 1 character')
    .max(50, 'Nickname cannot exceed 50 characters')
    .trim()
    .optional(),
  currentMileage: mileageSchema,
  purchaseDate: z.coerce.date().optional().nullable(),
  purchasePrice: priceSchema,
  licensePlate: z.string().max(15).optional().nullable(),
  exteriorColor: z.string().max(50).optional().nullable(),
  interiorColor: z.string().max(50).optional().nullable(),
  isPrimary: z.boolean().optional(),
});

export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

export const vehicleIdParamSchema = z.object({
  id: uuidSchema,
});

export type VehicleIdParam = z.infer<typeof vehicleIdParamSchema>;

export const listVehiclesQuerySchema = paginationSchema.extend({
  includeInactive: z.coerce.boolean().default(false),
});

export type ListVehiclesQuery = z.infer<typeof listVehiclesQuerySchema>;

export const addMaintenanceRecordSchema = z.object({
  serviceType: z.string().min(1, 'Service type is required'),
  description: z.string().max(1000).optional().nullable(),
  serviceDate: z.coerce.date(),
  mileage: mileageSchema,
  shopId: uuidSchema.optional().nullable(),
  shopName: z.string().max(200).optional().nullable(),
  cost: priceSchema,
  partsUsed: z
    .array(
      z.object({
        name: z.string().min(1),
        partNumber: z.string().optional().nullable(),
        cost: z.number().min(0).optional().nullable(),
      })
    )
    .default([]),
  receiptUrl: z.string().url().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type AddMaintenanceRecordInput = z.infer<typeof addMaintenanceRecordSchema>;

export const updateMaintenanceRecordSchema = addMaintenanceRecordSchema.partial();

export type UpdateMaintenanceRecordInput = z.infer<typeof updateMaintenanceRecordSchema>;

export const maintenanceRecordIdParamSchema = z.object({
  vehicleId: uuidSchema,
  recordId: uuidSchema,
});

export type MaintenanceRecordIdParam = z.infer<typeof maintenanceRecordIdParamSchema>;

export const listMaintenanceQuerySchema = paginationSchema.extend({
  serviceType: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type ListMaintenanceQuery = z.infer<typeof listMaintenanceQuerySchema>;

import { z } from 'zod';

import { DiagnosticStatus } from '../constants/api';
import { ContentLimits } from '../constants/limits';

import { uuidSchema, paginationSchema, obdCodeSchema } from './common';

export const createDiagnosticSchema = z.object({
  vehicleId: uuidSchema.optional().nullable(),
  symptoms: z
    .array(z.string().min(1).max(500))
    .min(1, 'At least one symptom is required')
    .max(ContentLimits.maxSymptomsPerSession, `Maximum ${ContentLimits.maxSymptomsPerSession} symptoms allowed`),
  obdCodes: z
    .array(obdCodeSchema)
    .max(ContentLimits.maxObdCodesPerSession, `Maximum ${ContentLimits.maxObdCodesPerSession} OBD codes allowed`)
    .default([]),
  description: z.string().max(2000).optional(),
});

export type CreateDiagnosticInput = z.infer<typeof createDiagnosticSchema>;

export const updateDiagnosticSchema = z.object({
  symptoms: z
    .array(z.string().min(1).max(500))
    .max(ContentLimits.maxSymptomsPerSession)
    .optional(),
  obdCodes: z.array(obdCodeSchema).max(ContentLimits.maxObdCodesPerSession).optional(),
  status: z.nativeEnum(DiagnosticStatus).optional(),
  vehicleId: uuidSchema.optional().nullable(),
});

export type UpdateDiagnosticInput = z.infer<typeof updateDiagnosticSchema>;

export const diagnosticIdParamSchema = z.object({
  id: uuidSchema,
});

export type DiagnosticIdParam = z.infer<typeof diagnosticIdParamSchema>;

export const listDiagnosticsQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(DiagnosticStatus).optional(),
  vehicleId: uuidSchema.optional(),
  urgency: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});

export type ListDiagnosticsQuery = z.infer<typeof listDiagnosticsQuerySchema>;

export const addDiagnosticImageSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  description: z.string().max(500).optional(),
});

export type AddDiagnosticImageInput = z.infer<typeof addDiagnosticImageSchema>;

export const analyzeDiagnosticSchema = z.object({
  diagnosticId: uuidSchema.optional(),
  vehicleId: uuidSchema.optional(),
  symptoms: z.array(z.string().min(1).max(500)).min(1).optional(),
  obdCodes: z.array(obdCodeSchema).optional(),
  imageUrls: z.array(z.string().url()).max(5).optional(),
  additionalContext: z.string().max(2000).optional(),
});

export type AnalyzeDiagnosticInput = z.infer<typeof analyzeDiagnosticSchema>;

export const lookupObdCodeSchema = z.object({
  code: obdCodeSchema,
});

export type LookupObdCodeInput = z.infer<typeof lookupObdCodeSchema>;

export const resolveDiagnosticSchema = z.object({
  resolution: z.string().max(2000).optional(),
  actualCost: z.number().min(0).optional(),
  shopId: uuidSchema.optional(),
});

export type ResolveDiagnosticInput = z.infer<typeof resolveDiagnosticSchema>;

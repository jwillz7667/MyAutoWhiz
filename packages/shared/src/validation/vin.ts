import { z } from 'zod';

import { vinSchema } from './common';

export const decodeVinSchema = z.object({
  vin: vinSchema,
});

export type DecodeVinInput = z.infer<typeof decodeVinSchema>;

export const vinParamSchema = z.object({
  vin: vinSchema,
});

export type VinParam = z.infer<typeof vinParamSchema>;

export const bulkDecodeVinSchema = z.object({
  vins: z
    .array(vinSchema)
    .min(1, 'At least one VIN is required')
    .max(100, 'Maximum 100 VINs per request'),
});

export type BulkDecodeVinInput = z.infer<typeof bulkDecodeVinSchema>;

export const vinLookupQuerySchema = z.object({
  includeRecalls: z.coerce.boolean().default(true),
  includeSafety: z.coerce.boolean().default(true),
  includeMarketValue: z.coerce.boolean().default(false),
});

export type VinLookupQuery = z.infer<typeof vinLookupQuerySchema>;

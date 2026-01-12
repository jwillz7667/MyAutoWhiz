import { z } from 'zod';

import { ShopSpecialties, ShopCertifications } from '../types/shop';

import { latitudeSchema, longitudeSchema, uuidSchema, emailSchema, phoneSchema } from './common';

export const searchShopsSchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  radiusMiles: z.coerce.number().min(1).max(100).default(25),
  specialty: z.enum(ShopSpecialties).optional(),
  certification: z.enum(ShopCertifications).optional(),
  minRating: z.coerce.number().min(1).max(5).optional(),
  openNow: z.coerce.boolean().optional(),
  sortBy: z.enum(['distance', 'rating', 'reviews']).default('distance'),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
});

export type SearchShopsInput = z.infer<typeof searchShopsSchema>;

export const shopIdParamSchema = z.object({
  id: uuidSchema,
});

export type ShopIdParam = z.infer<typeof shopIdParamSchema>;

export const contactShopSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  email: emailSchema,
  phone: phoneSchema,
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message cannot exceed 2000 characters'),
  vehicleId: uuidSchema.optional(),
  diagnosticId: uuidSchema.optional(),
});

export type ContactShopInput = z.infer<typeof contactShopSchema>;

export const getShopDirectionsSchema = z.object({
  shopId: uuidSchema,
  originLatitude: latitudeSchema,
  originLongitude: longitudeSchema,
});

export type GetShopDirectionsInput = z.infer<typeof getShopDirectionsSchema>;

export const shopSearchByTextSchema = z.object({
  query: z.string().min(2).max(200),
  latitude: latitudeSchema.optional(),
  longitude: longitudeSchema.optional(),
  radiusMiles: z.coerce.number().min(1).max(100).default(50),
  limit: z.coerce.number().min(1).max(50).default(20),
});

export type ShopSearchByTextInput = z.infer<typeof shopSearchByTextSchema>;

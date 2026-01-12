import { z } from 'zod';

import { ContentLimits } from '../constants/limits';

// VIN validation (17 characters, alphanumeric, no I, O, Q)
export const vinSchema = z
  .string()
  .length(ContentLimits.vinLength, `VIN must be exactly ${ContentLimits.vinLength} characters`)
  .regex(/^[A-HJ-NPR-Z0-9]+$/i, 'VIN can only contain alphanumeric characters (no I, O, or Q)')
  .transform((val) => val.toUpperCase());

// Email validation
export const emailSchema = z.string().email('Invalid email address').toLowerCase().trim();

// Password validation
export const passwordSchema = z
  .string()
  .min(ContentLimits.minPasswordLength, `Password must be at least ${ContentLimits.minPasswordLength} characters`)
  .max(ContentLimits.maxPasswordLength, `Password cannot exceed ${ContentLimits.maxPasswordLength} characters`)
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least one special character');

// UUID validation
export const uuidSchema = z.string().uuid('Invalid ID format');

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Date range
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  { message: 'Start date must be before or equal to end date' }
);

// Phone number (basic validation)
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional()
  .nullable();

// URL validation
export const urlSchema = z.string().url('Invalid URL format').optional().nullable();

// Positive number
export const positiveNumberSchema = z.number().positive('Must be a positive number');

// Non-negative number
export const nonNegativeNumberSchema = z.number().min(0, 'Cannot be negative');

// Mileage
export const mileageSchema = z.coerce
  .number()
  .int('Mileage must be a whole number')
  .min(0, 'Mileage cannot be negative')
  .max(1000000, 'Mileage seems too high')
  .optional()
  .nullable();

// Price (in cents for precision)
export const priceSchema = z.coerce
  .number()
  .int('Price must be in cents')
  .min(0, 'Price cannot be negative')
  .optional()
  .nullable();

// Latitude
export const latitudeSchema = z.coerce
  .number()
  .min(-90, 'Latitude must be between -90 and 90')
  .max(90, 'Latitude must be between -90 and 90');

// Longitude
export const longitudeSchema = z.coerce
  .number()
  .min(-180, 'Longitude must be between -180 and 180')
  .max(180, 'Longitude must be between -180 and 180');

// OBD-II code
export const obdCodeSchema = z
  .string()
  .regex(/^[PCBU][0-9A-F]{4}$/i, 'Invalid OBD-II code format')
  .transform((val) => val.toUpperCase());

// Image attachment
export const imageAttachmentSchema = z.object({
  type: z.literal('image'),
  url: z.string().url('Invalid image URL'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  fileName: z.string().optional().nullable(),
  fileSize: z.number().max(ContentLimits.maxImageSize, 'Image too large').optional().nullable(),
});

// Generic ID params
export const idParamSchema = z.object({
  id: uuidSchema,
});

// Query with optional search
export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200).optional(),
});

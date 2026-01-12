import { z } from 'zod';

import { phoneSchema, urlSchema, uuidSchema } from './common';

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .trim()
    .optional(),
  phone: phoneSchema,
  avatarUrl: urlSchema,
  preferences: z
    .object({
      notifications: z.boolean().optional(),
      emailNotifications: z.boolean().optional(),
      pushNotifications: z.boolean().optional(),
      theme: z.enum(['light', 'dark', 'system']).optional(),
      measurementUnit: z.enum(['imperial', 'metric']).optional(),
      defaultVehicleId: uuidSchema.nullable().optional(),
    })
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required to delete account'),
  confirmText: z
    .string()
    .refine((val) => val === 'DELETE', { message: 'Please type DELETE to confirm' }),
});

export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;

export const inviteFamilyMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export type InviteFamilyMemberInput = z.infer<typeof inviteFamilyMemberSchema>;

export const acceptFamilyInviteSchema = z.object({
  inviteId: uuidSchema,
});

export type AcceptFamilyInviteInput = z.infer<typeof acceptFamilyInviteSchema>;

export const removeFamilyMemberSchema = z.object({
  memberId: uuidSchema,
});

export type RemoveFamilyMemberInput = z.infer<typeof removeFamilyMemberSchema>;

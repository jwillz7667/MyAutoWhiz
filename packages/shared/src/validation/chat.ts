import { z } from 'zod';

import { ChatSessionType, ChatStatus } from '../constants/api';
import { ContentLimits } from '../constants/limits';

import { uuidSchema, paginationSchema, imageAttachmentSchema } from './common';

export const createChatSessionSchema = z.object({
  sessionType: z.nativeEnum(ChatSessionType).default(ChatSessionType.GENERAL),
  vehicleId: uuidSchema.optional().nullable(),
  title: z.string().max(200).optional(),
  initialMessage: z.string().max(ContentLimits.maxChatMessageLength).optional(),
});

export type CreateChatSessionInput = z.infer<typeof createChatSessionSchema>;

export const updateChatSessionSchema = z.object({
  title: z.string().max(200).optional(),
  status: z.nativeEnum(ChatStatus).optional(),
  vehicleId: uuidSchema.optional().nullable(),
});

export type UpdateChatSessionInput = z.infer<typeof updateChatSessionSchema>;

export const chatSessionIdParamSchema = z.object({
  id: uuidSchema,
});

export type ChatSessionIdParam = z.infer<typeof chatSessionIdParamSchema>;

export const listChatSessionsQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(ChatStatus).optional(),
  sessionType: z.nativeEnum(ChatSessionType).optional(),
  vehicleId: uuidSchema.optional(),
});

export type ListChatSessionsQuery = z.infer<typeof listChatSessionsQuerySchema>;

export const sendMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(ContentLimits.maxChatMessageLength, `Message cannot exceed ${ContentLimits.maxChatMessageLength} characters`),
  attachments: z
    .array(imageAttachmentSchema)
    .max(ContentLimits.maxImagesPerMessage, `Maximum ${ContentLimits.maxImagesPerMessage} images per message`)
    .default([]),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

export const listMessagesQuerySchema = paginationSchema.extend({
  before: z.coerce.date().optional(),
  after: z.coerce.date().optional(),
});

export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;

export const chatMessageIdParamSchema = z.object({
  sessionId: uuidSchema,
  messageId: uuidSchema,
});

export type ChatMessageIdParam = z.infer<typeof chatMessageIdParamSchema>;

export const regenerateMessageSchema = z.object({
  messageId: uuidSchema,
});

export type RegenerateMessageInput = z.infer<typeof regenerateMessageSchema>;

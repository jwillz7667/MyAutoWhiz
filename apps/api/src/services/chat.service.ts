import type {
  ChatSession,
  ChatSessionWithMessages,
  ChatSessionSummary,
  ChatMessage,
  StreamingChatMessage,
  CreateChatSessionInput,
  SendMessageInput,
  MessageAttachment,
} from '@myautowhiz/shared';
import { ChatSessionType, ChatStatus, MessageRole, DataRetention } from '@myautowhiz/shared';

import { prisma, Prisma } from '../lib/prisma';
import { ChatSessionNotFoundError, ForbiddenError } from '../utils/errors';
import { logger } from '../utils/logger';

import { incrementChatMessageCount } from '../middleware/rateLimit';
import { openaiService } from './openai.service';

class ChatService {
  async listSessions(
    userId: string,
    options: {
      status?: keyof typeof ChatStatus;
      sessionType?: keyof typeof ChatSessionType;
      vehicleId?: string;
      page?: number;
      pageSize?: number;
    } = {}
  ): Promise<{ sessions: ChatSessionSummary[]; total: number }> {
    const { status, sessionType, vehicleId, page = 1, pageSize = 20 } = options;

    const where = {
      userId,
      ...(status && { status }),
      ...(sessionType && { sessionType }),
      ...(vehicleId && { vehicleId }),
    };

    const [sessions, total] = await Promise.all([
      prisma.chatSession.findMany({
        where,
        include: {
          vehicle: {
            select: { nickname: true, year: true, make: true, model: true },
          },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.chatSession.count({ where }),
    ]);

    return {
      sessions: sessions.map((s: (typeof sessions)[number]) => ({
        id: s.id,
        title: s.title,
        sessionType: s.sessionType,
        status: s.status,
        vehicleNickname: s.vehicle?.nickname || null,
        vehicleInfo: s.vehicle
          ? `${s.vehicle.year} ${s.vehicle.make} ${s.vehicle.model}`
          : null,
        lastMessageAt: s.messages[0]?.createdAt || null,
        messageCount: s._count.messages,
        createdAt: s.createdAt,
      })),
      total,
    };
  }

  async getSession(userId: string, sessionId: string): Promise<ChatSessionWithMessages> {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        vehicle: {
          select: { id: true, nickname: true, year: true, make: true, model: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      throw ChatSessionNotFoundError();
    }

    return {
      id: session.id,
      userId: session.userId,
      vehicleId: session.vehicleId,
      sessionType: session.sessionType,
      title: session.title,
      status: session.status,
      systemContext: session.systemContext as Record<string, unknown> | null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      vehicle: session.vehicle,
      messages: session.messages.map((m: (typeof session.messages)[number]) => ({
        id: m.id,
        sessionId: m.sessionId,
        role: m.role,
        content: m.content,
        attachments: (m.attachments as unknown) as MessageAttachment[],
        functionCalls: m.functionCalls as ChatMessage['functionCalls'],
        promptTokens: m.promptTokens,
        completionTokens: m.completionTokens,
        createdAt: m.createdAt,
      })),
    };
  }

  async createSession(userId: string, input: CreateChatSessionInput): Promise<ChatSession> {
    // Verify vehicle ownership if provided
    if (input.vehicleId) {
      const vehicle = await prisma.vehicle.findFirst({
        where: { id: input.vehicleId, userId },
      });
      if (!vehicle) {
        throw ForbiddenError('Vehicle not found or not owned by user');
      }
    }

    const session = await prisma.chatSession.create({
      data: {
        userId,
        vehicleId: input.vehicleId,
        sessionType: input.sessionType || ChatSessionType.GENERAL,
        title: input.title,
        status: ChatStatus.ACTIVE,
      },
    });

    // Add initial message if provided
    if (input.initialMessage) {
      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: MessageRole.USER,
          content: input.initialMessage,
        },
      });
    }

    logger.info('Chat session created', { userId, sessionId: session.id });

    return {
      id: session.id,
      userId: session.userId,
      vehicleId: session.vehicleId,
      sessionType: session.sessionType,
      title: session.title,
      status: session.status,
      systemContext: session.systemContext as Record<string, unknown> | null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  async updateSession(
    userId: string,
    sessionId: string,
    input: { title?: string; status?: keyof typeof ChatStatus; vehicleId?: string | null }
  ): Promise<ChatSession> {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw ChatSessionNotFoundError();
    }

    const updated = await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        title: input.title,
        status: input.status,
        vehicleId: input.vehicleId,
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      vehicleId: updated.vehicleId,
      sessionType: updated.sessionType,
      title: updated.title,
      status: updated.status,
      systemContext: updated.systemContext as Record<string, unknown> | null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw ChatSessionNotFoundError();
    }

    await prisma.chatSession.delete({ where: { id: sessionId } });

    logger.info('Chat session deleted', { userId, sessionId });
  }

  async *sendMessage(
    userId: string,
    sessionId: string,
    input: SendMessageInput
  ): AsyncGenerator<StreamingChatMessage> {
    // Get session with recent messages
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: {
        vehicle: {
          select: { year: true, make: true, model: true, vin: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 20, // Last 20 messages for context
        },
      },
    });

    if (!session) {
      throw ChatSessionNotFoundError();
    }

    // Save user message
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: MessageRole.USER,
        content: input.content,
        attachments: input.attachments || [],
      },
    });

    // Increment usage counter
    await incrementChatMessageCount(userId);

    // Build conversation history
    const messages = session.messages
      .reverse()
      .map((m: (typeof session.messages)[number]) => ({
        role: m.role.toLowerCase() as 'user' | 'assistant' | 'system',
        content: m.content,
        attachments: (m.attachments as unknown) as MessageAttachment[],
      }));

    // Add current message
    messages.push({
      role: 'user',
      content: input.content,
      attachments: input.attachments?.map((a) => ({
        ...a,
        fileName: a.fileName ?? null,
        fileSize: a.fileSize ?? null,
      })),
    });

    // Vehicle context
    const vehicleContext = session.vehicle
      ? {
          year: session.vehicle.year || undefined,
          make: session.vehicle.make || undefined,
          model: session.vehicle.model || undefined,
          vin: session.vehicle.vin,
        }
      : undefined;

    // Stream response from OpenAI
    let assistantContent = '';
    const functionCalls: { name: string; arguments: Record<string, unknown>; result: unknown }[] = [];

    try {
      for await (const chunk of openaiService.streamChat(messages, vehicleContext)) {
        yield chunk;

        if (chunk.type === 'content' && chunk.content) {
          assistantContent += chunk.content;
        }

        if (chunk.type === 'function_result' && chunk.functionResult) {
          functionCalls.push({
            name: chunk.functionResult.name,
            arguments: {},
            result: chunk.functionResult.result,
          });
        }
      }

      // Save assistant message
      await prisma.chatMessage.create({
        data: {
          sessionId,
          role: MessageRole.ASSISTANT,
          content: assistantContent,
          functionCalls: functionCalls.length > 0 ? JSON.parse(JSON.stringify(functionCalls)) : undefined,
        },
      });

      // Update session title if first message
      if (!session.title && messages.length <= 2) {
        const title = this.generateTitle(input.content);
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: { title },
        });
      }

      // Update session timestamp
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });

      logger.info('Chat message sent', { userId, sessionId, messageLength: assistantContent.length });
    } catch (error) {
      logger.error('Chat error', { userId, sessionId, error });
      yield { type: 'error', error: 'Failed to get AI response' };
    }
  }

  async getMessages(
    userId: string,
    sessionId: string,
    options: { before?: Date; after?: Date; limit?: number } = {}
  ): Promise<ChatMessage[]> {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw ChatSessionNotFoundError();
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        sessionId,
        ...(options.before && { createdAt: { lt: options.before } }),
        ...(options.after && { createdAt: { gt: options.after } }),
      },
      orderBy: { createdAt: 'asc' },
      take: options.limit || 50,
    });

    return messages.map((m: (typeof messages)[number]) => ({
      id: m.id,
      sessionId: m.sessionId,
      role: m.role,
      content: m.content,
      attachments: (m.attachments as unknown) as MessageAttachment[],
      functionCalls: m.functionCalls as ChatMessage['functionCalls'],
      promptTokens: m.promptTokens,
      completionTokens: m.completionTokens,
      createdAt: m.createdAt,
    }));
  }

  private generateTitle(content: string): string {
    // Generate title from first message
    const cleaned = content.replace(/\n/g, ' ').trim();
    if (cleaned.length <= 50) {
      return cleaned;
    }
    return cleaned.substring(0, 47) + '...';
  }
}

export const chatService = new ChatService();

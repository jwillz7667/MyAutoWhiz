import type { ChatSessionTypeType, ChatStatusType, MessageRoleType } from '../constants/api';

export interface ChatSession {
  id: string;
  userId: string;
  vehicleId: string | null;
  sessionType: ChatSessionTypeType;
  title: string | null;
  status: ChatStatusType;
  systemContext: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
  vehicle: {
    id: string;
    nickname: string | null;
    year: number | null;
    make: string | null;
    model: string | null;
  } | null;
}

export interface ChatSessionSummary {
  id: string;
  title: string | null;
  sessionType: ChatSessionTypeType;
  status: ChatStatusType;
  vehicleNickname: string | null;
  vehicleInfo: string | null; // "2021 Honda Accord"
  lastMessageAt: Date | null;
  messageCount: number;
  createdAt: Date;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: MessageRoleType;
  content: string;
  attachments: MessageAttachment[];
  functionCalls: FunctionCall[] | null;
  promptTokens: number | null;
  completionTokens: number | null;
  createdAt: Date;
}

export interface MessageAttachment {
  type: 'image';
  url: string;
  mimeType: string;
  fileName: string | null;
  fileSize: number | null;
}

export interface FunctionCall {
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
}

export interface StreamingChatMessage {
  type: 'content' | 'function_call' | 'function_result' | 'done' | 'error';
  content?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
  functionResult?: {
    name: string;
    result: unknown;
  };
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface SendMessageRequest {
  content: string;
  attachments?: MessageAttachment[];
  vehicleId?: string;
}

export interface CreateChatSessionRequest {
  sessionType: ChatSessionTypeType;
  vehicleId?: string;
  title?: string;
  initialMessage?: string;
}

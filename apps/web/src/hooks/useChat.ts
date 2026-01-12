'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import type { ChatSession, ChatSessionWithMessages, ChatSessionSummary, ChatMessage } from '@myautowhiz/shared';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Fetch chat sessions (summary list)
export function useChatSessions(page = 1, limit = 20) {
  return useQuery<PaginatedResponse<ChatSessionSummary>>({
    queryKey: ['chat-sessions', page, limit],
    queryFn: () =>
      api.get<PaginatedResponse<ChatSessionSummary>>('/chat/sessions', {
        params: { page, limit },
      }),
  });
}

// Fetch a single chat session with vehicle details
export function useChatSession(id: string) {
  return useQuery<ChatSessionWithMessages>({
    queryKey: ['chat-session', id],
    queryFn: () => api.get<ChatSessionWithMessages>(`/chat/sessions/${id}`),
    enabled: !!id,
  });
}

// Fetch messages for a session
export function useChatMessages(sessionId: string, page = 1, limit = 50) {
  return useQuery<PaginatedResponse<ChatMessage>>({
    queryKey: ['chat-messages', sessionId, page, limit],
    queryFn: () =>
      api.get<PaginatedResponse<ChatMessage>>(`/chat/sessions/${sessionId}/messages`, {
        params: { page, limit },
      }),
    enabled: !!sessionId,
  });
}

// Create chat session
export function useCreateChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { vehicleId?: string; title?: string }) =>
      api.post<ChatSession>('/chat/sessions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}

// Delete chat session
export function useDeleteChatSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/chat/sessions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
    },
  });
}

// Send message hook with streaming support
export function useSendMessage(sessionId: string) {
  const queryClient = useQueryClient();
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');

  const sendMessage = useCallback(
    async (content: string, images?: File[]) => {
      setIsStreaming(true);
      setStreamContent('');

      try {
        // If there are images, use form data
        if (images && images.length > 0) {
          const formData = new FormData();
          formData.append('content', content);
          images.forEach((image) => {
            formData.append('images', image);
          });

          const response = await api.upload<ChatMessage>(
            `/chat/sessions/${sessionId}/messages`,
            formData
          );

          queryClient.invalidateQueries({
            queryKey: ['chat-messages', sessionId],
          });

          return response;
        }

        // Stream response for text-only messages
        let fullContent = '';

        for await (const chunk of api.stream(
          `/chat/sessions/${sessionId}/stream`,
          { content }
        )) {
          fullContent += chunk;
          setStreamContent(fullContent);
        }

        // Invalidate to get the complete messages
        queryClient.invalidateQueries({
          queryKey: ['chat-messages', sessionId],
        });

        return { content: fullContent };
      } finally {
        setIsStreaming(false);
      }
    },
    [sessionId, queryClient]
  );

  return {
    sendMessage,
    isStreaming,
    streamContent,
  };
}

// Non-streaming message mutation
export function useSendMessageMutation(sessionId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      content,
      images,
    }: {
      content: string;
      images?: File[];
    }) => {
      if (images && images.length > 0) {
        const formData = new FormData();
        formData.append('content', content);
        images.forEach((image) => {
          formData.append('images', image);
        });
        return api.upload<ChatMessage>(
          `/chat/sessions/${sessionId}/messages`,
          formData
        );
      }

      return api.post<ChatMessage>(`/chat/sessions/${sessionId}/messages`, {
        content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['chat-messages', sessionId],
      });
    },
  });
}

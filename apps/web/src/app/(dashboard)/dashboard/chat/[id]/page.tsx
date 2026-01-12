'use client';

import { useState, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Image as ImageIcon, X, Bot, User, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useChatSession, useChatMessages, useSendMessage } from '@/hooks/useChat';
import { useAuthStore } from '@/stores/auth.store';
import { cn, formatDateTime } from '@/lib/utils';

export default function ChatSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const { user } = useAuthStore();
  const { data: session, isLoading: sessionLoading } = useChatSession(sessionId);
  const { data: messagesData, isLoading: messagesLoading } = useChatMessages(sessionId);
  const { sendMessage, isStreaming, streamContent } = useSendMessage(sessionId);

  const [input, setInput] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages = messagesData?.data || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && images.length === 0) return;

    const content = input.trim();
    setInput('');
    const imagesToSend = [...images];
    setImages([]);

    try {
      await sendMessage(content, imagesToSend.length > 0 ? imagesToSend : undefined);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages((prev) => [...prev, ...files].slice(0, 5));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  if (sessionLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-muted-foreground">Chat session not found</p>
        <Button asChild variant="link" className="mt-2">
          <Link href="/dashboard/chat">Back to chats</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/chat">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="font-semibold">{session.title || 'Chat'}</h1>
          <p className="text-sm text-muted-foreground">
            {session.vehicle
              ? `${session.vehicle.year} ${session.vehicle.make} ${session.vehicle.model}`
              : 'General chat'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 chat-scrollbar">
        {messagesLoading ? (
          <div className="flex h-full items-center justify-center">
            <Spinner />
          </div>
        ) : messages.length === 0 && !isStreaming ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <Bot className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 font-semibold">How can I help you today?</h3>
            <p className="max-w-md text-sm text-muted-foreground">
              Ask me anything about your vehicle - maintenance, repairs, diagnostics, or finding the best shops near you.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'flex gap-3',
                  message.role === 'USER' ? 'flex-row-reverse' : ''
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    message.role === 'USER'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.role === 'USER' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-4 py-2',
                    message.role === 'USER'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {message.attachments.map((attachment, i) => (
                        <img
                          key={i}
                          src={attachment.url}
                          alt={attachment.fileName || 'Attached'}
                          className="h-20 w-20 rounded object-cover"
                        />
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs opacity-60">
                    {formatDateTime(message.createdAt)}
                  </p>
                </div>
              </div>
            ))}

            {/* Streaming response */}
            {isStreaming && streamContent && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
                  <p className="whitespace-pre-wrap text-sm">{streamContent}</p>
                  <Loader2 className="mt-2 h-4 w-4 animate-spin" />
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {isStreaming && !streamContent && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-lg bg-muted px-4 py-2">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="flex gap-2 border-t pt-2">
          {images.map((image, index) => (
            <div key={index} className="relative">
              <img
                src={URL.createObjectURL(image)}
                alt="Preview"
                className="h-16 w-16 rounded object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -right-1 -top-1 rounded-full bg-destructive p-0.5 text-destructive-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t pt-4">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isStreaming || images.length >= 5}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isStreaming}
          className="flex-1"
        />
        <Button type="submit" disabled={isStreaming || (!input.trim() && images.length === 0)}>
          {isStreaming ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

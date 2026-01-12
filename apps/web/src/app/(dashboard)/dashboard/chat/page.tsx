'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageSquare, Plus, Trash2, Car, MoreVertical } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';
import { useChatSessions, useCreateChatSession, useDeleteChatSession } from '@/hooks/useChat';
import { useVehicles } from '@/hooks/useVehicles';
import { toast } from '@/stores/ui.store';
import { formatRelativeTime } from '@/lib/utils';

export default function ChatPage() {
  const router = useRouter();
  const { data: sessionsData, isLoading: sessionsLoading } = useChatSessions();
  const { data: vehiclesData } = useVehicles();
  const createSession = useCreateChatSession();
  const deleteSession = useDeleteChatSession();

  const sessions = sessionsData?.data || [];
  const vehicles = vehiclesData?.data || [];

  const handleNewChat = async (vehicleId?: string) => {
    try {
      const session = await createSession.mutateAsync({
        vehicleId,
        title: vehicleId ? undefined : 'New conversation',
      });
      router.push(`/dashboard/chat/${session.id}`);
    } catch (error) {
      toast.error('Error', 'Failed to create chat session.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      await deleteSession.mutateAsync(id);
      toast.success('Deleted', 'Conversation deleted.');
    } catch (error) {
      toast.error('Error', 'Failed to delete conversation.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Chat</h1>
          <p className="text-muted-foreground">
            Get instant answers about your vehicles
          </p>
        </div>
        <Button onClick={() => handleNewChat()} disabled={createSession.isPending}>
          {createSession.isPending ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          New Chat
        </Button>
      </div>

      {/* Quick start with vehicles */}
      {vehicles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Start</CardTitle>
            <CardDescription>Start a chat about one of your vehicles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {vehicles.slice(0, 5).map((vehicle) => (
                <Button
                  key={vehicle.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleNewChat(vehicle.id)}
                  disabled={createSession.isPending}
                >
                  <Car className="mr-2 h-4 w-4" />
                  {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Conversations</CardTitle>
          <CardDescription>Your recent chat sessions</CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Spinner />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex h-32 flex-col items-center justify-center text-center">
              <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-muted-foreground">No conversations yet</p>
              <Button variant="link" onClick={() => handleNewChat()} className="mt-2">
                Start your first chat
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent"
                >
                  <Link
                    href={`/dashboard/chat/${session.id}`}
                    className="flex flex-1 items-center gap-3"
                  >
                    <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{session.title || 'Untitled conversation'}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.messageCount || 0} messages • {formatRelativeTime(session.lastMessageAt || session.createdAt)}
                      </p>
                    </div>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(session.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Ask about maintenance schedules, repair costs, or common issues
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Upload photos of dashboard lights or parts for visual diagnosis
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Get repair estimates and find nearby shops
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              Start a chat about a specific vehicle for context-aware answers
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

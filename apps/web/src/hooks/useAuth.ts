'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export function useAuth(options?: { requireAuth?: boolean; redirectTo?: string }) {
  const { requireAuth = false, redirectTo = '/login' } = options || {};
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !isAuthenticated) {
      router.push(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, requireAuth, redirectTo, pathname, router]);

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}

export function useRequireAuth(redirectTo = '/login') {
  return useAuth({ requireAuth: true, redirectTo });
}

export function useRequireGuest(redirectTo = '/dashboard') {
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, redirectTo, router]);

  return {
    user,
    isLoading,
    isAuthenticated,
  };
}

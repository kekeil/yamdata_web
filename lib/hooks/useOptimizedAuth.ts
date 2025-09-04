'use client';

import { useAuthStore } from '@/lib/store/authStore';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UseOptimizedAuthOptions {
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function useOptimizedAuth(options: UseOptimizedAuthOptions = {}) {
  const { 
    user, 
    isAdmin, 
    isSupport, 
    isLoading, 
    error, 
    checkSession 
  } = useAuthStore();
  
  const router = useRouter();
  const hasCheckedSession = useRef(false);
  
  const {
    requireAuth = false,
    requireAdmin = false,
    redirectTo = '/login'
  } = options;

  // Vérifier la session une seule fois au montage du hook
  useEffect(() => {
    if (!hasCheckedSession.current && !user && !isLoading) {
      hasCheckedSession.current = true;
      checkSession();
    }
  }, [checkSession, user, isLoading]);

  // Gestion des redirections seulement si nécessaire
  useEffect(() => {
    if (isLoading) return;

    if (requireAuth && !user) {
      router.replace(redirectTo);
      return;
    }

    if (requireAdmin && user && !isAdmin) {
      router.replace('/access-denied');
      return;
    }
  }, [user, isAdmin, isLoading, requireAuth, requireAdmin, redirectTo, router]);

  return {
    user,
    isAdmin,
    isSupport,
    isLoading,
    error,
    isAuthenticated: !!user,
    hasRequiredPermissions: requireAdmin ? isAdmin : true
  };
}

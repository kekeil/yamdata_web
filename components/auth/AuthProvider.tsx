'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { usePathname, useRouter } from 'next/navigation';


export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { checkSession, user, isAdmin, isLoading } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  // Mémoriser les vérifications pour éviter les re-renders inutiles
  const isDashboardRoute = useMemo(() => pathname.startsWith('/admin/dashboard'), [pathname]);
  const isLoginRoute = useMemo(() => pathname === '/login', [pathname]);

  // Vérifier la session au chargement de l'application une seule fois
  useEffect(() => {
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mémoriser les redirections pour éviter les re-calculs
  const handleRedirections = useCallback(() => {
    if (isLoading || typeof user === 'undefined') return;

    // Redirection pour les routes dashboard
    if (isDashboardRoute) {
      if (!user && pathname !== '/login') {
        router.replace('/login');
        return;
      }
      if (user && !isAdmin && pathname !== '/access-denied') {
        router.replace('/access-denied');
        return;
      }
    }

    // Redirection pour la page de login
    if (isLoginRoute && user && isAdmin) {
      router.replace('/admin/dashboard/overview');
      return;
    }
  }, [user, isAdmin, isLoading, isDashboardRoute, isLoginRoute, pathname, router]);

  useEffect(() => {
    handleRedirections();
  }, [handleRedirections]);

  return <>{children}</>;
} 
'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useAuthStore } from '@/lib/store/authStore';
import { usePathname, useRouter } from 'next/navigation';

console.log('[AUTH DEBUG] AuthProvider monté/re-render');

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { checkSession, user, isAdmin, isLoading } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  // Mémoriser les vérifications pour éviter les re-renders inutiles
  const isDashboardRoute = useMemo(() => pathname.startsWith('/dashboard'), [pathname]);
  const isLoginRoute = useMemo(() => pathname === '/login', [pathname]);

  // Vérifier la session au chargement de l'application une seule fois
  useEffect(() => {
    console.log('[AUTH DEBUG][useEffect-montage] Appel checkSession');
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mémoriser les redirections pour éviter les re-calculs
  const handleRedirections = useCallback(() => {
    if (isLoading || typeof user === 'undefined') return;

    // Redirection pour les routes dashboard
    if (isDashboardRoute) {
      if (!user && pathname !== '/login') {
        console.log('[AUTH DEBUG][redirect] Pas de user, redirection vers /login');
        router.replace('/login');
        return;
      }
      if (user && !isAdmin && pathname !== '/access-denied') {
        console.log('[AUTH DEBUG][redirect] User sans admin, redirection vers /access-denied');
        router.replace('/access-denied');
        return;
      }
    }

    // Redirection pour la page de login
    if (isLoginRoute && user && isAdmin) {
      console.log('[AUTH DEBUG][redirect] User admin connecté sur /login, redirection vers /dashboard/overview');
      router.replace('/dashboard/overview');
      return;
    }
  }, [user, isAdmin, isLoading, isDashboardRoute, isLoginRoute, pathname, router]);

  useEffect(() => {
    handleRedirections();
  }, [handleRedirections]);

  console.log("SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("SUPABASE_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  return <>{children}</>;
} 
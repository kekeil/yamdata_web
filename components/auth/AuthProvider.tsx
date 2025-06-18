'use client';

import { useEffect } from 'react';
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

  // Vérifier la session au chargement de l'application
  useEffect(() => {
    console.log('[AUTH DEBUG][useEffect-montage] Appel checkSession');
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log('[AUTH DEBUG][useEffect-redirection] user:', user, 'isAdmin:', isAdmin, 'isLoading:', isLoading, 'pathname:', pathname);
    if (isLoading || typeof user === 'undefined') return;

    // Redirection pour les routes dashboard
    if (pathname.startsWith('/dashboard')) {
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
    if (pathname === '/login' && user && isAdmin) {
      console.log('[AUTH DEBUG][redirect] User admin connecté sur /login, redirection vers /dashboard/overview');
      router.replace('/dashboard/overview');
      return;
    }
  }, [user, isAdmin, isLoading, pathname, router]);

  return <>{children}</>;
} 
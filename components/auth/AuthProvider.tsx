'use client';

import { useEffect } from 'react';
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
  
  // Vérifier la session au chargement de l'application
  useEffect(() => {
    checkSession();
  }, [checkSession]);
  
  // Gérer les redirections basées sur l'authentification
  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (isLoading) return;
    
    // Protéger les routes du dashboard côté client (en plus du middleware)
    const isDashboardRoute = pathname?.startsWith('/dashboard');
    
    if (isDashboardRoute && !user) {
      router.push('/login');
    } else if (isDashboardRoute && !isAdmin) {
      router.push('/access-denied');
    }
    
    // Rediriger les utilisateurs connectés de la page de connexion vers le dashboard
    if (user && isAdmin && pathname === '/login') {
      router.push('/dashboard/overview');
    }
  }, [user, isAdmin, isLoading, pathname, router]);
  
  return <>{children}</>;
} 
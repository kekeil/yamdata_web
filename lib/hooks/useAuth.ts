import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

interface UseAuthOptions {
  /**
   * Rediriger vers cette URL si l'utilisateur n'est pas connecté
   */
  redirectTo?: string;
  
  /**
   * Rediriger vers cette URL si l'utilisateur est connecté
   */
  redirectIfFound?: string;
  
  /**
   * Nécessite que l'utilisateur soit admin
   */
  requireAdmin?: boolean;
  
  /**
   * Nécessite que l'utilisateur ait un rôle spécifique (admin ou support)
   */
  requireRole?: 'admin' | 'support';
}

/**
 * Hook pour gérer l'authentification et les protections de route
 * @param options Options de configuration
 * @returns État d'authentification et méthodes
 */
export function useAuth(options: UseAuthOptions = {}) {
  const router = useRouter();
  const { 
    user, 
    isAdmin, 
    isSupport,
    isLoading, 
    error, 
    login, 
    logout, 
    checkSession,
    refreshUserRole 
  } = useAuthStore();
  
  useEffect(() => {
    // Vérifier la session au chargement
    checkSession();
  }, [checkSession]);
  
  useEffect(() => {
    // Ne rien faire pendant le chargement
    if (isLoading) return;
    
    // Redirection basée sur les options
    if (!user) {
      // Si l'utilisateur n'est pas connecté et qu'une redirection est demandée
      if (options.redirectTo) {
        router.push(options.redirectTo);
      }
    } else {
      // Si l'utilisateur est connecté
      
      // Vérification des rôles requis
      if (options.requireAdmin && !isAdmin) {
        router.push('/access-denied');
        return;
      }
      
      if (options.requireRole === 'admin' && !isAdmin) {
        router.push('/access-denied');
        return;
      }
      
      if (options.requireRole === 'support' && !isSupport && !isAdmin) {
        router.push('/access-denied');
        return;
      }
      
      // Redirection si l'utilisateur est trouvé et qu'une redirection est demandée
      if (options.redirectIfFound) {
        router.push(options.redirectIfFound);
      }
    }
  }, [
    user, 
    isAdmin, 
    isSupport,
    isLoading, 
    router, 
    options.redirectTo, 
    options.redirectIfFound, 
    options.requireAdmin,
    options.requireRole
  ]);
  
  return {
    user,
    isAdmin,
    isSupport,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    logout,
    refreshUserRole
  };
} 
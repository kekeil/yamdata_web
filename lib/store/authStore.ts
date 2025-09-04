"use client";
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  isSupport: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAdmin: false,
      isSupport: false,
      isLoading: true,
      error: null,
      
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          console.log('[AUTH STORE][login] Tentative de connexion pour', email);
          // Connexion avec Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          console.log('[AUTH STORE][login] Résultat:', { data, error });
          if (error) throw error;
          if (data.user) {
            // Récupérer tous les rôles en une seule requête optimisée
            const { data: userRoles, error: rolesError } = await supabase
              .from('user_roles')
              .select(`
                roles!inner (
                  name
                )
              `)
              .eq('user_id', data.user.id);
            
            console.log('[AUTH STORE][login] Rôles récupérés:', { userRoles, rolesError });
            
            const roleNames = userRoles?.map(ur => ur.roles?.name).filter(Boolean) || [];
            const isAdmin = roleNames.includes('admin');
            const isSupport = roleNames.includes('support');
            
            set({ 
              user: data.user, 
              isAdmin,
              isSupport,
              isLoading: false,
              error: null
            });
            console.log('[AUTH STORE][login] Utilisateur connecté:', { user: data.user, isAdmin, isSupport });
          }
        } catch (error: any) {
          set({ 
            user: null,
            isAdmin: false,
            isSupport: false,
            error: error.message, 
            isLoading: false 
          });
          console.error('[AUTH STORE][login] Erreur:', error);
        }
      },
      
      logout: async () => {
        try {
          set({ isLoading: true });
          console.log('[AUTH STORE][logout] Déconnexion en cours...');
          await supabase.auth.signOut();
          set({ 
            user: null, 
            isAdmin: false, 
            isSupport: false,
            isLoading: false, 
            error: null 
          });
          console.log('[AUTH STORE][logout] Utilisateur déconnecté.');
        } catch (error: any) {
          set({ isLoading: false, error: error.message });
          console.error('[AUTH STORE][logout] Erreur:', error);
        }
      },
      
      checkSession: async () => {
        try {
          set({ isLoading: true });
          console.log('[AUTH STORE][checkSession] Vérification de la session...');
          const { data: { session } } = await supabase.auth.getSession();
          console.log('[AUTH STORE][checkSession] Session récupérée:', session);
          if (!session) {
            set({ 
              user: null, 
              isAdmin: false, 
              isSupport: false,
              isLoading: false, 
              error: null 
            });
            console.log('[AUTH STORE][checkSession] Pas de session.');
            return;
          }
          // Récupérer tous les rôles en une seule requête optimisée
          const { data: userRoles, error: rolesError } = await supabase
            .from('user_roles')
            .select(`
              roles!inner (
                name
              )
            `)
            .eq('user_id', session.user.id);
          
          console.log('[AUTH STORE][checkSession] Rôles récupérés:', { userRoles, rolesError });
          
          const roleNames = userRoles?.map(ur => ur.roles?.name).filter(Boolean) || [];
          const isAdmin = roleNames.includes('admin');
          const isSupport = roleNames.includes('support');
          
          set({ 
            user: session.user, 
            isAdmin,
            isSupport,
            isLoading: false,
            error: null
          });
          console.log('[AUTH STORE][checkSession] Utilisateur connecté:', { user: session.user, isAdmin, isSupport });
        } catch (error: any) {
          set({ 
            user: null, 
            isAdmin: false, 
            isSupport: false,
            isLoading: false, 
            error: null 
          });
          console.error('[AUTH STORE][checkSession] Erreur:', error);
        }
      },
      
      refreshUserRole: async () => {
        const { user } = get();
        if (!user) {
          console.log('[AUTH STORE][refreshUserRole] Pas d\'utilisateur connecté.');
          return;
        }
        try {
          // Vérifier si l'utilisateur est admin
          const { data: isAdminResult, error: adminRoleError } = await supabase.rpc('is_user_admin', {
            user_id_param: user.id
          });
          console.log('[AUTH STORE][refreshUserRole] Résultat isAdmin:', { isAdminResult, adminRoleError });
          if (adminRoleError) {
            console.error("Erreur vérification admin (refresh):", adminRoleError.message);
          }
          // Vérifier si l'utilisateur est support
          const { data: isSupportResult, error: supportRoleError } = await supabase.rpc('has_role', {
            user_id_param: user.id,
            role_name_param: 'support'
          });
          console.log('[AUTH STORE][refreshUserRole] Résultat isSupport:', { isSupportResult, supportRoleError });
          if (supportRoleError) {
            console.error("Erreur vérification support (refresh):", supportRoleError.message);
          }
          set({
            isAdmin: !!isAdminResult,
            isSupport: !!isSupportResult
          });
          console.log('[AUTH STORE][refreshUserRole] Rôles mis à jour:', { isAdmin: !!isAdminResult, isSupport: !!isSupportResult });
        } catch (error) {
          console.error("Erreur lors du rafraîchissement des rôles:", error);
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAdmin: state.isAdmin, isSupport: state.isSupport }),
    }
  )
); 
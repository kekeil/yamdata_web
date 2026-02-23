"use client";
import { create } from 'zustand';
import { persist, persist as persistMiddleware } from 'zustand/middleware';
import { supabase } from '../supabase/client';
import { User } from '@supabase/supabase-js';

// Nom de la clé utilisée par persist pour sauvegarder dans localStorage
const AUTH_STORAGE_KEY = 'auth-storage';

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
      isLoading: false,
      error: null,
      
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            const { data: userRoles } = await supabase
              .from('user_roles')
              .select(`
                roles!inner (
                  name
                )
              `)
              .eq('user_id', data.user.id);
            
            const roleNames = userRoles?.map(ur => {
              const role = ur.roles;
              if (role && !Array.isArray(role)) {
                return (role as { name: string }).name;
              } else if (Array.isArray(role) && role[0]) {
                return (role[0] as { name: string }).name;
              }
              return null;
            }).filter(Boolean) as string[] || [];

            set({ 
              user: data.user, 
              isAdmin: roleNames.includes('admin'),
              isSupport: roleNames.includes('support'),
              isLoading: false,
              error: null
            });
          }
  } catch (error: any) {
  set({
    user: null,
    isAdmin: false,
    isSupport: false,
    error: error.message,
    isLoading: false
  });
  throw error; // ← AJOUTEZ CETTE LIGNE ICI
}},
      
      // ✅ CORRIGÉ : logout vide bien le cache persistant
      logout: async () => {
        try {
          set({ isLoading: true });

          // 1. Déconnecter Supabase
          await supabase.auth.signOut();

          // 2. Réinitialiser l'état du store en mémoire
          set({ 
            user: null, 
            isAdmin: false, 
            isSupport: false,
            isLoading: false, 
            error: null 
          });

          // 3. Supprimer le cache persistant du localStorage
          //    C'est la clé manquante qui causait le problème !
          if (typeof window !== 'undefined') {
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }

          // 4. Supprimer tous les canaux Supabase en cours
          await supabase.removeAllChannels();

        } catch (error: any) {
          set({ isLoading: false, error: error.message });
        }
      },
      
      checkSession: async () => {
        try {
          set({ isLoading: true });
          const { data: { user }, error } = await supabase.auth.getUser();

          if (error || !user) {
            set({ 
              user: null, 
              isAdmin: false, 
              isSupport: false,
              isLoading: false, 
              error: null 
            });
            return;
          }
          
          // Éviter de refaire la requête si déjà vérifié
          const currentState = get();
          if (currentState.user?.id === user.id && !currentState.isLoading) {
            set({ isLoading: false });
            return;
          }
          
          const { data: userRoles } = await supabase
            .from('user_roles')
            .select(`
              roles!inner (
                name
              )
            `)
            .eq('user_id', user.id);
          
          const roleNames = userRoles?.map(ur => {
            const role = ur.roles;
            if (role && !Array.isArray(role)) {
              return (role as { name: string }).name;
            } else if (Array.isArray(role) && role[0]) {
              return (role[0] as { name: string }).name;
            }
            return null;
          }).filter(Boolean) as string[] || [];

          set({ 
            user, 
            isAdmin: roleNames.includes('admin'),
            isSupport: roleNames.includes('support'),
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          set({ 
            user: null, 
            isAdmin: false, 
            isSupport: false,
            isLoading: false, 
            error: null 
          });
        }
      },
      
      refreshUserRole: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const { data: isAdminResult } = await supabase.rpc('is_user_admin', {
            user_id_param: user.id
          });

          const { data: isSupportResult } = await supabase.rpc('has_role', {
            user_id_param: user.id,
            role_name_param: 'support'
          });

          set({
            isAdmin: !!isAdminResult,
            isSupport: !!isSupportResult
          });
        } catch (error) {
          console.error('Erreur lors du rafraîchissement des rôles:', error);
        }
      }
    }),
    {
      name: AUTH_STORAGE_KEY,
      partialize: (state) => ({ user: state.user, isAdmin: state.isAdmin, isSupport: state.isSupport }),
    }
  )
);
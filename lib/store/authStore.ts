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
          // Connexion avec Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
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
            
            const roleNames = userRoles?.map(ur => {
              const role = ur.roles;
              if (role && !Array.isArray(role)) {
                return (role as { name: string }).name;
              } else if (Array.isArray(role) && role[0]) {
                return (role[0] as { name: string }).name;
              }
              return null;
            }).filter(Boolean) as string[] || [];
            const isAdmin = roleNames.includes('admin');
            const isSupport = roleNames.includes('support');
            
            set({ 
              user: data.user, 
              isAdmin,
              isSupport,
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
        }
      },
      
      logout: async () => {
        try {
          set({ isLoading: true });
          await supabase.auth.signOut();
          set({ 
            user: null, 
            isAdmin: false, 
            isSupport: false,
            isLoading: false, 
            error: null 
          });
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
          
          // Vérifier si l'utilisateur est déjà en cours de vérification
          const currentState = get();
          if (currentState.user?.id === user.id && !currentState.isLoading) {
            set({ isLoading: false });
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
          const isAdmin = roleNames.includes('admin');
          const isSupport = roleNames.includes('support');
          
          set({ 
            user: user, 
            isAdmin,
            isSupport,
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
        if (!user) {
          return;
        }
        try {
          // Vérifier si l'utilisateur est admin
          const { data: isAdminResult, error: adminRoleError } = await supabase.rpc('is_user_admin', {
            user_id_param: user.id
          });
          if (adminRoleError) {
          }
          // Vérifier si l'utilisateur est support
          const { data: isSupportResult, error: supportRoleError } = await supabase.rpc('has_role', {
            user_id_param: user.id,
            role_name_param: 'support'
          });
          if (supportRoleError) {
          }
          set({
            isAdmin: !!isAdminResult,
            isSupport: !!isSupportResult
          });
        } catch (error) {
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAdmin: state.isAdmin, isSupport: state.isSupport }),
    }
  )
); 
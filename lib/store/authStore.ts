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
            // Vérifier si l'utilisateur est admin
            const { data: isAdminResult, error: adminRoleError } = await supabase.rpc('is_user_admin', {
              user_id_param: data.user.id
            });
            
            if (adminRoleError) {
              console.error("Erreur vérification admin:", adminRoleError.message);
            }
            
            // Vérifier si l'utilisateur est support
            const { data: isSupportResult, error: supportRoleError } = await supabase.rpc('has_role', {
              user_id_param: data.user.id,
              role_name_param: 'support'
            });
            
            if (supportRoleError) {
              console.error("Erreur vérification support:", supportRoleError.message);
            }
            
            set({ 
              user: data.user, 
              isAdmin: !!isAdminResult,
              isSupport: !!isSupportResult,
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
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            set({ 
              user: null, 
              isAdmin: false, 
              isSupport: false,
              isLoading: false, 
              error: null 
            });
            return;
          }
          
          // Vérifier si l'utilisateur est admin
          const { data: isAdminResult, error: adminRoleError } = await supabase.rpc('is_user_admin', {
            user_id_param: session.user.id
          });
          
          if (adminRoleError) {
            console.error("Erreur vérification admin (session):", adminRoleError.message);
          }
          
          // Vérifier si l'utilisateur est support
          const { data: isSupportResult, error: supportRoleError } = await supabase.rpc('has_role', {
            user_id_param: session.user.id,
            role_name_param: 'support'
          });
          
          if (supportRoleError) {
            console.error("Erreur vérification support (session):", supportRoleError.message);
          }
          
          set({ 
            user: session.user, 
            isAdmin: !!isAdminResult,
            isSupport: !!isSupportResult,
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
          // Vérifier si l'utilisateur est admin
          const { data: isAdminResult, error: adminRoleError } = await supabase.rpc('is_user_admin', {
            user_id_param: user.id
          });
          
          if (adminRoleError) {
            console.error("Erreur vérification admin (refresh):", adminRoleError.message);
          }
          
          // Vérifier si l'utilisateur est support
          const { data: isSupportResult, error: supportRoleError } = await supabase.rpc('has_role', {
            user_id_param: user.id,
            role_name_param: 'support'
          });
          
          if (supportRoleError) {
            console.error("Erreur vérification support (refresh):", supportRoleError.message);
          }
          
          set({
            isAdmin: !!isAdminResult,
            isSupport: !!isSupportResult
          });
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
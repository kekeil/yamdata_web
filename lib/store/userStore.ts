"use client";
import { create } from 'zustand';
import { supabase } from '../supabase/client';
import { Profile } from '@/types/db';

interface UserState {
  users: Profile[];
  selectedUser: Profile | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchUsers: () => Promise<void>;
  fetchUserDetails: (userId: string) => Promise<void>;
  updateUserRole: (userId: string, roleId: number) => Promise<void>;
  addUserRole: (userId: string, roleName: 'admin' | 'user' | 'support') => Promise<void>;
  removeUserRole: (userId: string, roleName: 'admin' | 'user' | 'support') => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,
  
  fetchUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          email,
          full_name,
          phone, 
          created_at,
          updated_at,
          user_roles (
            user_id,
            role_id,
            assigned_at,
            roles (
              id,
              name
            )
          )
        `);
        
      if (error) throw error;
      
      // Mapper les données pour correspondre au type Profile
      const mappedUsers = (data || []).map((user: any) => ({
        ...user,
        updated_at: user.updated_at || user.created_at,
        user_roles: (user.user_roles || []).map((ur: any) => ({
          user_id: ur.user_id || user.id,
          role_id: ur.role_id || (ur.roles && !Array.isArray(ur.roles) ? ur.roles.id : Array.isArray(ur.roles) && ur.roles[0]?.id) || 0,
          assigned_at: ur.assigned_at || new Date().toISOString(),
          roles: ur.roles && !Array.isArray(ur.roles) ? ur.roles : Array.isArray(ur.roles) && ur.roles[0] ? ur.roles[0] : null
        }))
      }));
      
      set({ users: mappedUsers, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchUserDetails: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          phone,
          avatar_url,
          created_at,
          updated_at,
          user_roles (
            roles (
              id,
              name
            )
          ),
          savings_accounts (
            id,
            balance,
            type,
            interest_rate,
            last_interest_date,
            created_at
          ),
          transactions (
            id,
            type,
            amount,
            status,
            reference,
            created_at
          )
        `)
        .eq('id', userId)
        .single();
        
      if (error) throw error;
      
      // Mapper les données pour correspondre au type Profile
      const mappedUser = data ? {
        ...data,
        user_roles: (data.user_roles || []).map((ur: any) => ({
          user_id: ur.user_id || data.id,
          role_id: ur.role_id || (ur.roles && !Array.isArray(ur.roles) ? ur.roles.id : Array.isArray(ur.roles) && ur.roles[0]?.id) || 0,
          assigned_at: ur.assigned_at || new Date().toISOString(),
          roles: ur.roles && !Array.isArray(ur.roles) ? ur.roles : Array.isArray(ur.roles) && ur.roles[0] ? ur.roles[0] : null
        })),
        savings_accounts: (data.savings_accounts || []).map((sa: any) => ({
          ...sa,
          user_id: sa.user_id || data.id,
          updated_at: sa.updated_at || sa.created_at || new Date().toISOString()
        })),
        transactions: (data.transactions || []).map((tx: any) => ({
          ...tx,
          user_id: tx.user_id || data.id,
          updated_at: tx.updated_at || tx.created_at || new Date().toISOString()
        }))
      } : null;
      
      set({ selectedUser: mappedUser, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  updateUserRole: async (userId, roleId) => {
    set({ isLoading: true, error: null });
    try {
      // Supprimer les rôles existants
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
        
      // Ajouter le nouveau rôle
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role_id: roleId });
        
      if (error) throw error;
      
      // Rafraîchir la liste des utilisateurs
      await get().fetchUsers();
      
      // Si l'utilisateur sélectionné est celui modifié, rafraîchir ses détails
      const { selectedUser } = get();
      if (selectedUser && selectedUser.id === userId) {
        await get().fetchUserDetails(userId);
      }
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  addUserRole: async (userId, roleName) => {
    set({ isLoading: true, error: null });
    try {
      // Récupérer l'ID du rôle par son nom
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single();
        
      if (roleError) throw roleError;
      
      // Vérifier si l'utilisateur a déjà ce rôle
      const { data: existingRole, error: checkError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role_id', roleData.id);
        
      if (checkError) throw checkError;
      
      // Si le rôle n'existe pas déjà, l'ajouter
      if (!existingRole || existingRole.length === 0) {
        const { error } = await supabase
          .from('user_roles')
          .insert({ 
            user_id: userId, 
            role_id: roleData.id 
          });
          
        if (error) throw error;
      }
      
      // Rafraîchir la liste des utilisateurs
      await get().fetchUsers();
      
      // Si l'utilisateur sélectionné est celui modifié, rafraîchir ses détails
      const { selectedUser } = get();
      if (selectedUser && selectedUser.id === userId) {
        await get().fetchUserDetails(userId);
      }
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  removeUserRole: async (userId, roleName) => {
    set({ isLoading: true, error: null });
    try {
      // Récupérer l'ID du rôle par son nom
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', roleName)
        .single();
        
      if (roleError) throw roleError;
      
      // Supprimer le rôle spécifique
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role_id', roleData.id);
        
      if (error) throw error;
      
      // Rafraîchir la liste des utilisateurs
      await get().fetchUsers();
      
      // Si l'utilisateur sélectionné est celui modifié, rafraîchir ses détails
      const { selectedUser } = get();
      if (selectedUser && selectedUser.id === userId) {
        await get().fetchUserDetails(userId);
      }
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  }
})); 
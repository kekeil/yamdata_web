"use client";
import { create } from 'zustand';
import { supabase } from '../supabase/client';
import { SavingsAccount, SavingsGoal, SavingsSettings, UserSavingsSummary } from '@/types/db';

interface SavingsState {
  accounts: SavingsAccount[];
  goals: SavingsGoal[];
  settings: SavingsSettings | null;
  savingsSummary: UserSavingsSummary[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchSavingsAccounts: (userId?: string) => Promise<void>;
  fetchSavingsGoals: (userId?: string) => Promise<void>;
  fetchSavingsSettings: () => Promise<void>;
  fetchUserSavingsSummary: () => Promise<void>;
  
  // Account management
  addSavingsAccount: (account: Omit<SavingsAccount, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSavingsAccount: (accountId: string, updates: Partial<Omit<SavingsAccount, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  
  // Goals management
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateSavingsGoal: (goalId: string, updates: Partial<Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  
  // Settings management
  updateSavingsSettings: (updates: Partial<Omit<SavingsSettings, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
}

export const useSavingsStore = create<SavingsState>((set, get) => ({
  accounts: [],
  goals: [],
  settings: null,
  savingsSummary: [],
  isLoading: false,
  error: null,
  
  fetchSavingsAccounts: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase
        .from('savings_accounts')
        .select(`
          id,
          user_id,
          balance,
          type,
          interest_rate,
          last_interest_date,
          metadata,
          created_at,
          updated_at
        `);
        
      // Si un userId est fourni, filtrer par utilisateur
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      set({ accounts: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchSavingsGoals: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase
        .from('savings_goals')
        .select(`
          id,
          user_id,
          account_id,
          name,
          target_amount,
          current_amount,
          target_date,
          status,
          created_at,
          updated_at
        `);
        
      // Si un userId est fourni, filtrer par utilisateur
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
        
      if (error) throw error;
      
      set({ goals: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchSavingsSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('savings_settings')
        .select('*')
        .single();
        
      if (error) throw error;
      
      set({ settings: data, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchUserSavingsSummary: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('user_savings_summary')
        .select('*');
        
      if (error) throw error;
      
      set({ savingsSummary: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  addSavingsAccount: async (account) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('savings_accounts')
        .insert({
          user_id: account.user_id,
          balance: account.balance,
          type: account.type,
          interest_rate: account.interest_rate,
          last_interest_date: account.last_interest_date,
          metadata: account.metadata
        });
        
      if (error) throw error;
      
      await get().fetchSavingsAccounts(account.user_id);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  updateSavingsAccount: async (accountId, updates) => {
    set({ isLoading: true, error: null });
    try {
      // D'abord, récupérer le compte pour obtenir l'ID de l'utilisateur
      const { data: account, error: fetchError } = await supabase
        .from('savings_accounts')
        .select('user_id')
        .eq('id', accountId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from('savings_accounts')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);
        
      if (error) throw error;
      
      await get().fetchSavingsAccounts(account.user_id);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  addSavingsGoal: async (goal) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('savings_goals')
        .insert({
          user_id: goal.user_id,
          account_id: goal.account_id,
          name: goal.name,
          target_amount: goal.target_amount,
          current_amount: goal.current_amount,
          target_date: goal.target_date,
          status: goal.status
        });
        
      if (error) throw error;
      
      await get().fetchSavingsGoals(goal.user_id);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  updateSavingsGoal: async (goalId, updates) => {
    set({ isLoading: true, error: null });
    try {
      // D'abord, récupérer l'objectif pour obtenir l'ID de l'utilisateur
      const { data: goal, error: fetchError } = await supabase
        .from('savings_goals')
        .select('user_id')
        .eq('id', goalId)
        .single();
        
      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from('savings_goals')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);
        
      if (error) throw error;
      
      await get().fetchSavingsGoals(goal.user_id);
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  updateSavingsSettings: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('savings_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', 1); // Supposons que nous n'avons qu'une seule entrée de paramètres
        
      if (error) throw error;
      
      await get().fetchSavingsSettings();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  }
})); 
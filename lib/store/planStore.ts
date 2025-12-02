"use client";
import { create } from 'zustand';
import { supabase } from '../supabase/client';
import { DataPlan, TelecomOperator } from '@/types/db';

interface PlanState {
  plans: DataPlan[];
  operators: TelecomOperator[];
  selectedPlan: DataPlan | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchPlans: () => Promise<void>;
  fetchOperators: () => Promise<void>;
  fetchPlanDetails: (planId: number) => Promise<void>;
  addPlan: (plan: Omit<DataPlan, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePlan: (planId: number, updates: Partial<Omit<DataPlan, 'id' | 'created_at' | 'updated_at'>>) => Promise<void>;
  togglePlanStatus: (planId: number, active: boolean) => Promise<void>;
  deletePlan: (planId: number) => Promise<void>;
  
  // Operator actions
  addOperator: (operator: Omit<TelecomOperator, 'id'>) => Promise<void>;
  updateOperator: (operatorId: number, updates: Partial<Omit<TelecomOperator, 'id'>>) => Promise<void>;
}

export const usePlanStore = create<PlanState>((set, get) => ({
  plans: [],
  operators: [],
  selectedPlan: null,
  isLoading: false,
  error: null,
  
  fetchPlans: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('data_plans')
        .select(`
          id,
          name,
          volume_go,
          price,
          validity_days,
          active,
          created_at,
          updated_at,
          telecom_operators (
            id,
            name,
            commission_rate
          )
        `);
        
      if (error) throw error;
      
      // Mapper les données pour correspondre au type DataPlan
      const mappedPlans = (data || []).map((plan: any) => {
        const operator = Array.isArray(plan.telecom_operators) && plan.telecom_operators.length > 0
          ? plan.telecom_operators[0]
          : plan.telecom_operators;
        return {
          ...plan,
          operator_id: operator?.id || 0,
          volume_go: plan.volume_go || 0,
          telecom_operators: operator
        };
      });
      
      set({ plans: mappedPlans, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchOperators: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('telecom_operators')
        .select('*')
        .order('name');
        
      if (error) throw error;
      
      set({ operators: data || [], isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  fetchPlanDetails: async (planId) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('data_plans')
        .select(`
          id,
          name,
          operator_id,
          volume_go,
          price,
          validity_days,
          active,
          created_at,
          updated_at,
          telecom_operators (
            id,
            name,
            commission_rate
          )
        `)
        .eq('id', planId)
        .single();
        
      if (error) throw error;
      
      // Mapper les données pour correspondre au type DataPlan
      const operator = data && Array.isArray(data.telecom_operators) && data.telecom_operators.length > 0
        ? data.telecom_operators[0]
        : data?.telecom_operators && !Array.isArray(data.telecom_operators)
          ? data.telecom_operators
          : null;
      const operatorId = operator && !Array.isArray(operator) ? (operator as { id: number }).id : 0;
      const mappedPlan: DataPlan | null = data && operator && !Array.isArray(operator) ? {
        ...data,
        operator_id: operatorId,
        volume_go: data.volume_go || 0,
        telecom_operators: operator as TelecomOperator
      } : null;
      
      set({ selectedPlan: mappedPlan, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  addPlan: async (plan) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('data_plans')
        .insert({
          name: plan.name,
          operator_id: plan.operator_id,
          volume_go: plan.volume_go,
          price: plan.price,
          validity_days: plan.validity_days,
          active: plan.active ?? true
        });
        
      if (error) throw error;
      
      await get().fetchPlans();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  updatePlan: async (planId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('data_plans')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', planId);
        
      if (error) throw error;
      
      await get().fetchPlans();
      
      // Si le plan sélectionné est celui modifié, mettre à jour ses détails
      const { selectedPlan } = get();
      if (selectedPlan && selectedPlan.id === planId) {
        await get().fetchPlanDetails(planId);
      }
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  togglePlanStatus: async (planId, active) => {
    await get().updatePlan(planId, { active });
  },
  
  deletePlan: async (planId) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('data_plans')
        .delete()
        .eq('id', planId);
        
      if (error) throw error;
      
      await get().fetchPlans();
      
      // Si le plan sélectionné est celui supprimé, le réinitialiser
      const { selectedPlan } = get();
      if (selectedPlan && selectedPlan.id === planId) {
        set({ selectedPlan: null });
      }
      
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  addOperator: async (operator) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('telecom_operators')
        .insert({
          name: operator.name,
          commission_rate: operator.commission_rate
        });
        
      if (error) throw error;
      
      await get().fetchOperators();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },
  
  updateOperator: async (operatorId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('telecom_operators')
        .update(updates)
        .eq('id', operatorId);
        
      if (error) throw error;
      
      await get().fetchOperators();
      set({ isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  }
})); 
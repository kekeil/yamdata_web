import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useOptimizedAuth } from './useOptimizedAuth';

interface DataPlan {
  id: number;
  name: string;
  volume_mb: number;
  price: number;
  validity_days: number;
  code_offer: string | null;
  plan_type: 'data' | 'sms' | 'airtime';
  sms_count: number | null;
  airtime_amount: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  telecom_operators: {
    id: number;
    name: string;
    commission_rate: number;
  };
}

const UPDATABLE_PLAN_KEYS = [
  'name',
  'volume_mb',
  'price',
  'validity_days',
  'operator_id',
  'code_offer',
  'active',
  'plan_type',
  'sms_count',
  'airtime_amount',
] as const;

type UpdatablePlanKey = (typeof UPDATABLE_PLAN_KEYS)[number];

function pickUpdatablePlanPayload(
  partial: Partial<DataPlan> & { operator_id?: number }
): Partial<Record<UpdatablePlanKey, string | number | boolean | null>> {
  const out: Partial<Record<UpdatablePlanKey, string | number | boolean | null>> = {};
  for (const key of UPDATABLE_PLAN_KEYS) {
    if (!(key in partial) || partial[key as keyof typeof partial] === undefined) {
      continue;
    }
    const v = partial[key as keyof typeof partial];
    if (key === 'name' && typeof v === 'string') {
      out.name = v.trim();
    } else if (key === 'code_offer') {
      if (v === null || v === '') {
        out.code_offer = null;
      } else if (typeof v === 'string') {
        const t = v.trim();
        out.code_offer = t === '' ? null : t;
      }
    } else {
      (out as Record<string, unknown>)[key] = v as string | number | boolean | null;
    }
  }
  return out;
}

interface Operator {
  id: number;
  name: string;
}

export function useOptimizedPlans() {
  const { user, isAdmin, isLoading: authLoading } = useOptimizedAuth({ 
    requireAuth: true, 
    requireAdmin: true 
  });
  
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchPlans = useCallback(async () => {
    if (hasFetched.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: plansError } = await supabase
        .from('data_plans')
        .select(`
          id,
          name,
          volume_mb,
          price,
          validity_days,
          code_offer,
          plan_type,
          sms_count,
          airtime_amount,
          active,
          created_at,
          updated_at,
          telecom_operators (
            id,
            name,
            commission_rate
          )
        `)
        .order('created_at', { ascending: false });

      if (plansError) {
        console.error('Erreur lors de la récupération des forfaits:', plansError);
        throw plansError;
      }

      // Mapper les données pour correspondre au type DataPlan
      const mappedPlans = (data || []).map((plan: any) => ({
        ...plan,
        telecom_operators: Array.isArray(plan.telecom_operators) && plan.telecom_operators.length > 0
          ? plan.telecom_operators[0]
          : plan.telecom_operators
      }));

      setPlans(mappedPlans);
      hasFetched.current = true;
    } catch (err: any) {
      console.error('Erreur lors du chargement des forfaits:', err);
      setError(err.message || 'Erreur lors du chargement des forfaits');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOperators = useCallback(async () => {
    try {
      const { data, error: operatorsError } = await supabase
        .from('telecom_operators')
        .select('id, name')
        .eq('active', true)
        .order('name');

      if (operatorsError) {
        console.error('Erreur lors de la récupération des opérateurs:', operatorsError);
        throw operatorsError;
      }
      
      setOperators(data || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des opérateurs:', err);
    }
  }, []);

  const addPlan = useCallback(async (planData: Omit<DataPlan, 'id' | 'created_at' | 'updated_at' | 'telecom_operators'> & { operator_id: number }) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('data_plans')
        .insert({
          name: planData.name.trim(),
          volume_mb: planData.volume_mb,
          price: planData.price,
          validity_days: planData.validity_days,
          operator_id: planData.operator_id,
          code_offer:
            planData.code_offer != null && String(planData.code_offer).trim() !== ''
              ? String(planData.code_offer).trim()
              : null,
          active: true,
          plan_type: planData.plan_type || 'data',
          sms_count: planData.sms_count ?? null,
          airtime_amount: planData.airtime_amount ?? null,
        })
        .select(`
          id,
          name,
          volume_mb,
          price,
          validity_days,
          code_offer,
          plan_type,
          sms_count,
          airtime_amount,
          active,
          created_at,
          updated_at,
          telecom_operators (
            id,
            name,
            commission_rate
          )
        `)
        .single();

      if (error) {
        console.error('Erreur lors de l\'ajout du forfait:', error);
        throw error;
      }

      // Mapper les données pour correspondre au type DataPlan
      const operator = data && Array.isArray(data.telecom_operators) && data.telecom_operators.length > 0
        ? data.telecom_operators[0]
        : data?.telecom_operators && !Array.isArray(data.telecom_operators)
          ? data.telecom_operators
          : null;
      
      const mappedData: DataPlan | null = data && operator ? {
        ...data,
        telecom_operators: operator as { id: number; name: string; commission_rate: number; }
      } : null;

      // Mettre à jour la liste locale
      if (mappedData) {
        setPlans(prev => [mappedData, ...prev]);
      }
      hasFetched.current = false; // Permettre le rechargement
      
      return mappedData || data;
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout du forfait:', err);
      setError(err.message || 'Erreur lors de l\'ajout du forfait');
      throw err;
    }
  }, []);

  const updatePlan = useCallback(async (id: number, partial: Partial<DataPlan> & { operator_id?: number }) => {
    try {
      setError(null);

      const payload = pickUpdatablePlanPayload(partial);
      if (Object.keys(payload).length === 0) {
        throw new Error('Aucun champ à mettre à jour.');
      }

      const { data, error } = await supabase
        .from('data_plans')
        .update(payload)
        .eq('id', id)
        .select(`
          id,
          name,
          volume_mb,
          price,
          validity_days,
          code_offer,
          plan_type,
          sms_count,
          airtime_amount,
          active,
          created_at,
          updated_at,
          telecom_operators (
            id,
            name,
            commission_rate
          )
        `)
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour du forfait:', error);
        throw error;
      }

      // Mapper les données pour correspondre au type DataPlan
      const operator = data && Array.isArray(data.telecom_operators) && data.telecom_operators.length > 0
        ? data.telecom_operators[0]
        : data?.telecom_operators && !Array.isArray(data.telecom_operators)
          ? data.telecom_operators
          : null;
      
      const mappedData: DataPlan | null = data && operator ? {
        ...data,
        telecom_operators: operator as { id: number; name: string; commission_rate: number; }
      } : null;

      // Mettre à jour la liste locale
      if (mappedData) {
        setPlans(prev => prev.map(plan => plan.id === id ? mappedData : plan));
      }
      
      return mappedData || data;
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du forfait:', err);
      setError(err.message || 'Erreur lors de la mise à jour du forfait');
      throw err;
    }
  }, []);

  const deletePlan = useCallback(async (id: number) => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('data_plans')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression du forfait:', error);
        throw error;
      }

      // Mettre à jour la liste locale
      setPlans(prev => prev.filter(plan => plan.id !== id));
      
    } catch (err: any) {
      console.error('Erreur lors de la suppression du forfait:', err);
      setError(err.message || 'Erreur lors de la suppression du forfait');
      throw err;
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && isAdmin && !hasFetched.current) {
      fetchPlans();
      fetchOperators();
    }
  }, [authLoading, user, isAdmin, fetchPlans, fetchOperators]);

  const refreshPlans = useCallback(() => {
    hasFetched.current = false;
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    operators,
    loading,
    error,
    addPlan,
    updatePlan,
    deletePlan,
    refreshPlans,
    isAuthenticated: !!user,
    isAdmin,
    authLoading
  };
}

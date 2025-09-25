import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useOptimizedAuth } from './useOptimizedAuth';

interface DataPlan {
  id: number;
  name: string;
  volume_mb: number;
  price: number;
  validity_days: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  telecom_operators: {
    id: number;
    name: string;
    commission_rate: number;
  };
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

      setPlans(data || []);
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
          active: true
        })
        .select(`
          id,
          name,
          volume_mb,
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
        .single();

      if (error) {
        console.error('Erreur lors de l\'ajout du forfait:', error);
        throw error;
      }

      // Mettre à jour la liste locale
      setPlans(prev => [data, ...prev]);
      hasFetched.current = false; // Permettre le rechargement
      
      return data;
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout du forfait:', err);
      setError(err.message || 'Erreur lors de l\'ajout du forfait');
      throw err;
    }
  }, []);

  const updatePlan = useCallback(async (id: number, updates: Partial<DataPlan>) => {
    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('data_plans')
        .update(updates)
        .eq('id', id)
        .select(`
          id,
          name,
          volume_mb,
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
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour du forfait:', error);
        throw error;
      }

      // Mettre à jour la liste locale
      setPlans(prev => prev.map(plan => plan.id === id ? data : plan));
      
      return data;
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

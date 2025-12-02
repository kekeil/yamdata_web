import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useOptimizedAuth } from './useOptimizedAuth';

interface SavingParameter {
  id: number;
  saving_rate: number;
  management_fee: number;
  effective_from: string;
  effective_to: string | null;
  saving_types: {
    id: number;
    name: string;
    lock_period_months: number;
    withdrawal_frequency: string;
  };
}

interface SavingStats {
  totalUsers: number;
  totalSavings: number;
  averageSavingPerUser: number;
}

export function useOptimizedSavings() {
  const { user, isAdmin, isLoading: authLoading } = useOptimizedAuth({ 
    requireAuth: true, 
    requireAdmin: true 
  });
  
  const [parameters, setParameters] = useState<SavingParameter[]>([]);
  const [stats, setStats] = useState<SavingStats>({
    totalUsers: 0,
    totalSavings: 0,
    averageSavingPerUser: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchParameters = useCallback(async () => {
    if (hasFetched.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: parametersError } = await supabase
        .from('saving_parameters')
        .select(`
          id,
          saving_rate,
          management_fee,
          effective_from,
          effective_to,
          saving_types (
            id,
            name,
            lock_period_months,
            withdrawal_frequency
          )
        `)
        .order('effective_from', { ascending: false });

      if (parametersError) {
        console.error('Erreur lors de la récupération des paramètres d\'épargne:', parametersError);
        throw parametersError;
      }

      // Mapper les données pour correspondre au type SavingParameter
      const mappedParameters = (data || []).map((param: any) => ({
        ...param,
        saving_types: Array.isArray(param.saving_types) && param.saving_types.length > 0
          ? param.saving_types[0]
          : param.saving_types
      }));

      setParameters(mappedParameters);
      hasFetched.current = true;
    } catch (err: any) {
      console.error('Erreur lors du chargement des paramètres d\'épargne:', err);
      setError(err.message || 'Erreur lors du chargement des paramètres d\'épargne');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      // Récupérer le nombre d'utilisateurs avec épargne
      const { count: userCount } = await supabase
        .from('user_savings')
        .select('*', { count: 'exact', head: true });
      
      // Récupérer le total d'épargne
      const { data: savingsData } = await supabase
        .from('user_savings')
        .select('balance');
      
      const totalSavings = savingsData?.reduce((sum, item) => sum + Number(item.balance), 0) || 0;
      const avgSaving = userCount ? totalSavings / userCount : 0;
      
      setStats({
        totalUsers: userCount || 0,
        totalSavings,
        averageSavingPerUser: avgSaving
      });
    } catch (err: any) {
      console.error('Erreur lors de la récupération des statistiques d\'épargne:', err);
    }
  }, []);

  const updateParameter = useCallback(async (id: number, updates: { saving_rate: number; management_fee: number }) => {
    try {
      setError(null);
      
      // Validation des valeurs
      if (updates.saving_rate < 0.01 || updates.saving_rate > 0.9) {
        throw new Error('Le taux d\'épargne doit être entre 1% et 90%');
      }
      
      if (updates.management_fee < 0 || updates.management_fee > 0.5) {
        throw new Error('Les frais de gestion doivent être entre 0% et 50%');
      }

      const { data, error } = await supabase
        .from('saving_parameters')
        .update({
          saving_rate: Number(updates.saving_rate.toFixed(3)),
          management_fee: Number(updates.management_fee.toFixed(3))
        })
        .eq('id', id)
        .select(`
          id,
          saving_rate,
          management_fee,
          effective_from,
          effective_to,
          saving_types (
            id,
            name,
            lock_period_months,
            withdrawal_frequency
          )
        `)
        .single();

      if (error) {
        console.error('Erreur lors de la mise à jour des paramètres:', error);
        throw error;
      }

      // Mapper les données pour correspondre au type SavingParameter
      const savingType = data && Array.isArray(data.saving_types) && data.saving_types.length > 0
        ? data.saving_types[0]
        : data?.saving_types && !Array.isArray(data.saving_types)
          ? data.saving_types
          : null;
      
      const mappedData: SavingParameter | null = data && savingType ? {
        ...data,
        saving_types: savingType as { id: number; name: string; lock_period_months: number; withdrawal_frequency: string; }
      } : null;

      // Mettre à jour la liste locale
      if (mappedData) {
        setParameters(prev => prev.map(param => param.id === id ? mappedData : param));
      }
      
      return mappedData || data;
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour des paramètres:', err);
      setError(err.message || 'Erreur lors de la mise à jour des paramètres');
      throw err;
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && isAdmin && !hasFetched.current) {
      fetchParameters();
      fetchStats();
    }
  }, [authLoading, user, isAdmin, fetchParameters, fetchStats]);

  const refreshParameters = useCallback(() => {
    hasFetched.current = false;
    fetchParameters();
  }, [fetchParameters]);

  return {
    parameters,
    stats,
    loading,
    error,
    updateParameter,
    refreshParameters,
    isAuthenticated: !!user,
    isAdmin,
    authLoading
  };
}

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useOptimizedAuth } from './useOptimizedAuth';

interface DashboardStats {
  users_count: number;
  total_savings: number;
  transactions_count: number;
  average_saving: number;
  operators_count: number;
  plans_count: number;
  transactions_this_month: number;
  new_users_this_week: number;
}

export function useOptimizedDashboard() {
  const { user, isAdmin, isLoading: authLoading } = useOptimizedAuth({ 
    requireAuth: true, 
    requireAdmin: true 
  });
  
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const fetchStats = useCallback(async () => {
    if (hasFetched.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Utiliser la vue optimisée dashboard_stats
      const { data, error: statsError } = await supabase
        .from('dashboard_stats')
        .select('*')
        .single();

      if (statsError) {
        console.error('Erreur lors de la récupération des statistiques:', statsError);
        throw statsError;
      }

      setStats(data);
      hasFetched.current = true;
    } catch (err: any) {
      console.error('Erreur lors du chargement du dashboard:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && isAdmin && !hasFetched.current) {
      fetchStats();
    }
  }, [authLoading, user, isAdmin, fetchStats]);

  const refreshStats = useCallback(() => {
    hasFetched.current = false;
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refreshStats,
    isAuthenticated: !!user,
    isAdmin,
    authLoading
  };
}

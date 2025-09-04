'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface PreregistrationStats {
  total_preregistrations: number;
  pending_count: number;
  marketing_consent_count: number;
  with_phone_count: number;
  average_priority_score: number;
  last_week_registrations: number;
  last_month_registrations: number;
}

export function usePreregistrationStats() {
  const [stats, setStats] = useState<PreregistrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Essayer d'abord de récupérer via la vue
      const { data: viewData, error: viewError } = await supabase
        .from('preregistration_stats')
        .select('*')
        .single();

      if (!viewError && viewData) {
        setStats(viewData);
        return;
      }

      // Si la vue n'existe pas ou échoue, calculer manuellement
      console.log('Vue preregistration_stats non disponible, calcul manuel...');
      
      const { data: preregistrations, error: dataError } = await supabase
        .from('preregistrations')
        .select('*');

      if (dataError) {
        throw dataError;
      }

      if (!preregistrations) {
        setStats({
          total_preregistrations: 0,
          pending_count: 0,
          marketing_consent_count: 0,
          with_phone_count: 0,
          average_priority_score: 0,
          last_week_registrations: 0,
          last_month_registrations: 0,
        });
        return;
      }

      // Calcul manuel des statistiques
      const now = new Date();
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const manualStats: PreregistrationStats = {
        total_preregistrations: preregistrations.length,
        pending_count: preregistrations.filter(p => p.status === 'pending').length,
        marketing_consent_count: preregistrations.filter(p => p.marketing_consent).length,
        with_phone_count: preregistrations.filter(p => p.phone && p.phone.trim() !== '').length,
        average_priority_score: preregistrations.length > 0 
          ? preregistrations.reduce((sum, p) => sum + (p.priority_score || 0), 0) / preregistrations.length 
          : 0,
        last_week_registrations: preregistrations.filter(p => 
          new Date(p.created_at) >= lastWeek
        ).length,
        last_month_registrations: preregistrations.filter(p => 
          new Date(p.created_at) >= lastMonth
        ).length,
      };

      setStats(manualStats);

    } catch (err: any) {
      console.error('Erreur lors de la récupération des statistiques:', err);
      setError(err.message);
      
      // Statistiques par défaut en cas d'erreur
      setStats({
        total_preregistrations: 0,
        pending_count: 0,
        marketing_consent_count: 0,
        with_phone_count: 0,
        average_priority_score: 0,
        last_week_registrations: 0,
        last_month_registrations: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}

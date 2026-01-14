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

      // Utiliser la fonction RPC pour récupérer les statistiques
      type PreregistrationStatsRPC = {
        total_preregistrations: number | null;
        pending_count: number | null;
        marketing_consent_count: number | null;
        with_phone_count: number | null;
        average_priority_score: number | null;
        friend_referrals: number | null;
        social_media_referrals: number | null;
        last_week_registrations: number | null;
        last_month_registrations: number | null;
      };

      const { data, error } = await supabase
        .rpc('get_preregistration_stats')
        .single<PreregistrationStatsRPC>();

      if (error) {
        throw error;
      }

      if (data) {
        setStats({
          total_preregistrations: Number(data.total_preregistrations) || 0,
          pending_count: Number(data.pending_count) || 0,
          marketing_consent_count: Number(data.marketing_consent_count) || 0,
          with_phone_count: Number(data.with_phone_count) || 0,
          average_priority_score: Number(data.average_priority_score) || 0,
          last_week_registrations: Number(data.last_week_registrations) || 0,
          last_month_registrations: Number(data.last_month_registrations) || 0,
        });
      } else {
        // Statistiques par défaut si aucune donnée
        setStats({
          total_preregistrations: 0,
          pending_count: 0,
          marketing_consent_count: 0,
          with_phone_count: 0,
          average_priority_score: 0,
          last_week_registrations: 0,
          last_month_registrations: 0,
        });
      }
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

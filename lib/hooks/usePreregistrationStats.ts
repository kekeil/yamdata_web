'use client';

import useSWR from 'swr';
import {
  fetchPreregistrationStats,
  type PreregistrationStats,
} from '@/lib/supabase/fetchPreregistrationStats';

export type { PreregistrationStats };

const PREREG_STATS_KEY = ['preregistration_stats'] as const;

/**
 * Statistiques préinscription via la vue SQL + cache SWR.
 * - Pas de RPC : lecture sur `preregistration_stats` (même logique que la RPC, matérialisée par la vue).
 * - Au plus un aller-retour réseau par minute par onglet (deduping), pas de boucle useEffect.
 */
export function usePreregistrationStats() {
  const { data, error, isLoading, mutate } = useSWR(PREREG_STATS_KEY, fetchPreregistrationStats, {
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
    refreshInterval: 0,
    shouldRetryOnError: true,
    errorRetryCount: 2,
  });

  return {
    stats: data ?? null,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    refetch: () => mutate(),
  };
}

import { supabase } from '@/lib/supabase/client';

/** Ligne unique de la vue `preregistration_stats` (agrégats pré-calculés côté Postgres). */
export interface PreregistrationStats {
  total_preregistrations: number;
  pending_count: number;
  marketing_consent_count: number;
  with_phone_count: number;
  average_priority_score: number;
  friend_referrals: number;
  social_media_referrals: number;
  last_week_registrations: number;
  last_month_registrations: number;
}

const EMPTY: PreregistrationStats = {
  total_preregistrations: 0,
  pending_count: 0,
  marketing_consent_count: 0,
  with_phone_count: 0,
  average_priority_score: 0,
  friend_referrals: 0,
  social_media_referrals: 0,
  last_week_registrations: 0,
  last_month_registrations: 0,
};

function normalize(row: Record<string, unknown> | null): PreregistrationStats {
  if (!row) return { ...EMPTY };
  return {
    total_preregistrations: Number(row.total_preregistrations) || 0,
    pending_count: Number(row.pending_count) || 0,
    marketing_consent_count: Number(row.marketing_consent_count) || 0,
    with_phone_count: Number(row.with_phone_count) || 0,
    average_priority_score: Number(row.average_priority_score) || 0,
    friend_referrals: Number(row.friend_referrals) || 0,
    social_media_referrals: Number(row.social_media_referrals) || 0,
    last_week_registrations: Number(row.last_week_registrations) || 0,
    last_month_registrations: Number(row.last_month_registrations) || 0,
  };
}

export async function fetchPreregistrationStats(): Promise<PreregistrationStats> {
  const { data, error } = await supabase
    .from('preregistration_stats')
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return normalize((data as Record<string, unknown> | null) ?? null);
}

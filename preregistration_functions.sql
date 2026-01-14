-- ============================================
-- FUNCTION: get_preregistration_stats
-- Description: Récupère les statistiques de préinscriptions
-- Accessibilité: Publique (accessible à tous)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_preregistration_stats()
RETURNS TABLE(
  total_preregistrations BIGINT,
  pending_count BIGINT,
  marketing_consent_count BIGINT,
  with_phone_count BIGINT,
  average_priority_score NUMERIC,
  friend_referrals BIGINT,
  social_media_referrals BIGINT,
  last_week_registrations BIGINT,
  last_month_registrations BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT 
    count(*) AS total_preregistrations,
    count(*) FILTER (WHERE status = 'pending'::text) AS pending_count,
    count(*) FILTER (WHERE marketing_consent = true) AS marketing_consent_count,
    count(*) FILTER (WHERE phone IS NOT NULL) AS with_phone_count,
    COALESCE(avg(priority_score), 0) AS average_priority_score,
    count(*) FILTER (WHERE referral_source = 'friend'::text) AS friend_referrals,
    count(*) FILTER (WHERE referral_source = 'social_media'::text) AS social_media_referrals,
    count(*) FILTER (WHERE created_at >= (CURRENT_DATE - INTERVAL '7 days')) AS last_week_registrations,
    count(*) FILTER (WHERE created_at >= (CURRENT_DATE - INTERVAL '30 days')) AS last_month_registrations
  FROM preregistrations;
$function$
;

-- ============================================
-- FUNCTION: update_preregistration
-- Description: Met à jour le statut et/ou les notes d'une préinscription
-- Accessibilité: Admins uniquement
-- ============================================
CREATE OR REPLACE FUNCTION public.update_preregistration(
  preregistration_id BIGINT,
  new_status TEXT DEFAULT NULL,
  new_notes TEXT DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT is_user_admin(auth.uid()) THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier que la préinscription existe
  IF NOT EXISTS (SELECT 1 FROM preregistrations WHERE id = preregistration_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Mettre à jour uniquement les champs fournis
  UPDATE preregistrations
  SET 
    status = COALESCE(new_status, status),
    notes = COALESCE(new_notes, notes),
    updated_at = now()
  WHERE id = preregistration_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$
;

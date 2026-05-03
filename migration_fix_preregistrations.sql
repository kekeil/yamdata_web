-- ============================================================
-- MIGRATION : Correction des noms de colonnes - table preregistrations
-- Problème : La table a été créée avec des noms de colonnes français
--            (nom_prenom, telephone, source_reference) alors que le
--            code TypeScript utilise full_name, phone, referral_source.
-- À exécuter dans l'éditeur SQL de Supabase.
-- ============================================================

-- 1. Renommer les colonnes pour correspondre au code
ALTER TABLE public.preregistrations RENAME COLUMN nom_prenom TO full_name;
ALTER TABLE public.preregistrations RENAME COLUMN telephone TO phone;
ALTER TABLE public.preregistrations RENAME COLUMN source_reference TO referral_source;

-- 2. Mettre à jour la politique RLS d'insertion pour valider aussi full_name
DROP POLICY IF EXISTS preregistrations_insert_merged ON public.preregistrations;
CREATE POLICY preregistrations_insert_merged ON public.preregistrations
FOR INSERT
TO public
WITH CHECK (
  (
    (email IS NOT NULL)
    AND (length(TRIM(BOTH FROM email)) > 0)
    AND (full_name IS NOT NULL)
    AND (length(TRIM(BOTH FROM full_name)) > 0)
    AND (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
  )
  OR is_user_admin(( SELECT auth.uid() AS uid))
);

-- 2. Recréer la vue preregistration_stats avec les nouveaux noms de colonnes
CREATE OR REPLACE VIEW public.preregistration_stats AS
 SELECT count(*) AS total_preregistrations,
    count(*) FILTER (WHERE (status = 'pending'::text)) AS pending_count,
    count(*) FILTER (WHERE (marketing_consent = true)) AS marketing_consent_count,
    count(*) FILTER (WHERE (phone IS NOT NULL)) AS with_phone_count,
    avg(priority_score) AS average_priority_score,
    count(*) FILTER (WHERE (referral_source = 'friend'::text)) AS friend_referrals,
    count(*) FILTER (WHERE (referral_source = 'social_media'::text)) AS social_media_referrals,
    count(*) FILTER (WHERE (created_at >= (CURRENT_DATE - '7 days'::interval))) AS last_week_registrations,
    count(*) FILTER (WHERE (created_at >= (CURRENT_DATE - '30 days'::interval))) AS last_month_registrations
   FROM preregistrations;

-- 3. Recréer la fonction get_preregistration_stats avec les nouveaux noms
CREATE OR REPLACE FUNCTION public.get_preregistration_stats()
 RETURNS TABLE(
   total_preregistrations bigint,
   pending_count bigint,
   marketing_consent_count bigint,
   with_phone_count bigint,
   average_priority_score numeric,
   friend_referrals bigint,
   social_media_referrals bigint,
   last_week_registrations bigint,
   last_month_registrations bigint
 )
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT 
    count(*)::bigint AS total_preregistrations,
    count(*) FILTER (WHERE status = 'pending')::bigint AS pending_count,
    count(*) FILTER (WHERE marketing_consent = true)::bigint AS marketing_consent_count,
    count(*) FILTER (WHERE phone IS NOT NULL)::bigint AS with_phone_count,
    COALESCE(avg(priority_score), 0)::numeric AS average_priority_score,
    count(*) FILTER (WHERE referral_source = 'friend')::bigint AS friend_referrals,
    count(*) FILTER (WHERE referral_source = 'social_media')::bigint AS social_media_referrals,
    count(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days')::bigint AS last_week_registrations,
    count(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days')::bigint AS last_month_registrations
  FROM preregistrations;
$function$;

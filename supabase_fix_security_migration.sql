-- ============================================
-- MIGRATION: Correction des alertes de sécurité Supabase
-- À exécuter dans le SQL Editor du dashboard Supabase
-- ============================================

-- ============================================
-- 1. ERREUR: RLS désactivé sur la table public.logs
-- Solution: Activer RLS et créer des politiques restrictives
-- ============================================

-- Activer RLS sur la table logs
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Politique: Seuls les admins peuvent lire les logs
DROP POLICY IF EXISTS "logs_admin_select" ON public.logs;
CREATE POLICY "logs_admin_select" ON public.logs
  FOR SELECT
  TO authenticated
  USING (is_user_admin(auth.uid()));

-- Pas de politique INSERT pour les utilisateurs = accès refusé par défaut (RLS)
-- La fonction log_preregistration (SECURITY DEFINER) contourne RLS pour écrire les logs


-- ============================================
-- 2. AVERTISSEMENT: Function search_path mutable sur log_preregistration
-- Solution: Définir un search_path fixe pour éviter les injections
-- ============================================

-- Corriger le search_path ET s'assurer que la fonction peut écrire dans logs malgré RLS
-- (SECURITY DEFINER = s'exécute avec les privilèges du propriétaire, contourne RLS)
ALTER FUNCTION public.log_preregistration() SET search_path = 'public', 'pg_temp';
ALTER FUNCTION public.log_preregistration() SECURITY DEFINER;


-- ============================================
-- 3. AVERTISSEMENT: Politique RLS trop permissive sur preregistrations
-- La politique "public preregistration insert" a WITH CHECK (true)
-- Solution: Supprimer cette politique et s'assurer que preregistrations_insert_merged est utilisée
-- ============================================

-- Supprimer la politique permissive si elle existe
DROP POLICY IF EXISTS "public preregistration insert" ON public.preregistrations;

-- S'assurer que la politique restrictive preregistrations_insert_merged existe
-- (validation email obligatoire et format valide)
DROP POLICY IF EXISTS preregistrations_insert_merged ON public.preregistrations;
CREATE POLICY preregistrations_insert_merged ON public.preregistrations
FOR INSERT
TO public
WITH CHECK (
  (
    email IS NOT NULL 
    AND length(TRIM(email)) > 0 
    AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ) 
  OR is_user_admin(auth.uid())
);


-- ============================================
-- RÉSUMÉ - À FAIRE MANUELLEMENT dans le dashboard Supabase
-- ============================================
--
-- 4. PROTECTION MOTS DE PASSE COMPROMIS (auth_leaked_password_protection)
--    → Authentication > Providers > Email > Activer "Leaked password protection"
--    → Ou: Project Settings > Auth > Leaked password protection
--
-- 5. MISE À JOUR POSTGRESQL (vulnerable_postgres_version)
--    → Project Settings > Infrastructure > Upgrade database
--    → Suivre les instructions de Supabase pour la mise à jour
--
-- En cas d'erreur sur ALTER FUNCTION log_preregistration:
-- Trouver la signature: SELECT proname, pg_get_function_identity_arguments(oid) FROM pg_proc WHERE proname = 'log_preregistration';
-- ============================================

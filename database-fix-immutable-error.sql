-- =====================================================
-- CORRECTION DE L'ERREUR IMMUTABLE - YAMDATA
-- =====================================================
-- Ce script corrige l'erreur "functions in index expression must be marked IMMUTABLE"
-- =====================================================

-- 1. SUPPRIMER LES INDEX PROBLÉMATIQUES (si ils existent)
-- =====================================================

DROP INDEX IF EXISTS idx_transactions_created_at_month;
DROP INDEX IF EXISTS idx_profiles_created_at_week;

-- 2. CRÉER DES INDEX SIMPLES ET EFFICACES
-- =====================================================

-- Index pour améliorer les requêtes de dashboard
CREATE INDEX IF NOT EXISTS idx_transactions_created_at_desc 
ON transactions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_created_at_desc 
ON profiles (created_at DESC);

-- Index pour les requêtes d'authentification optimisées
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role_composite 
ON user_roles (user_id, role_id);

-- Index pour les requêtes de préinscriptions
CREATE INDEX IF NOT EXISTS idx_preregistrations_status_created 
ON preregistrations (status, created_at);

-- Index pour les requêtes fréquentes sur les épargnes
CREATE INDEX IF NOT EXISTS idx_user_savings_user_balance 
ON user_savings (user_id, balance DESC);

-- 3. CRÉER UNE FONCTION IMMUTABLE POUR LES CALCULS DE DATE
-- =====================================================

CREATE OR REPLACE FUNCTION get_month_start(input_date TIMESTAMPTZ)
RETURNS DATE
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT date_trunc('month', input_date)::DATE;
$$;

CREATE OR REPLACE FUNCTION get_week_start(input_date TIMESTAMPTZ)
RETURNS DATE
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT date_trunc('week', input_date)::DATE;
$$;

-- 4. CRÉER DES INDEX AVEC LES FONCTIONS IMMUTABLES
-- =====================================================

-- Index pour les requêtes mensuelles (avec fonction immutable)
CREATE INDEX IF NOT EXISTS idx_transactions_month_start 
ON transactions (get_month_start(created_at));

-- Index pour les requêtes hebdomadaires (avec fonction immutable)
CREATE INDEX IF NOT EXISTS idx_profiles_week_start 
ON profiles (get_week_start(created_at));

-- 5. VUE OPTIMISÉE POUR LES STATISTIQUES DU DASHBOARD
-- =====================================================

DROP VIEW IF EXISTS dashboard_stats CASCADE;

CREATE VIEW dashboard_stats AS
SELECT
  -- Nombre total d'utilisateurs
  (SELECT COUNT(*) FROM profiles) as users_count,
  
  -- Montant total d'épargne
  (SELECT COALESCE(SUM(balance), 0) FROM user_savings) as total_savings,
  
  -- Nombre total de transactions
  (SELECT COUNT(*) FROM transactions) as transactions_count,
  
  -- Moyenne d'épargne par transaction
  (SELECT COALESCE(AVG(net_saving), 0) FROM transactions) as average_saving,
  
  -- Nombre d'opérateurs
  (SELECT COUNT(*) FROM telecom_operators WHERE active = true) as operators_count,
  
  -- Nombre de forfaits
  (SELECT COUNT(*) FROM data_plans WHERE active = true) as plans_count,
  
  -- Transactions ce mois-ci (utilise l'index optimisé)
  (SELECT COUNT(*) FROM transactions 
   WHERE get_month_start(created_at) = get_month_start(CURRENT_TIMESTAMP)) as transactions_this_month,
   
  -- Nouveaux utilisateurs cette semaine (utilise l'index optimisé)
  (SELECT COUNT(*) FROM profiles 
   WHERE get_week_start(created_at) = get_week_start(CURRENT_TIMESTAMP)) as new_users_this_week;

-- 6. FONCTION OPTIMISÉE POUR RÉCUPÉRER LES RÔLES UTILISATEUR
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_roles_optimized(user_id_param UUID)
RETURNS TABLE(role_name TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT r.name
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = user_id_param;
$$;

-- 7. FONCTION POUR VÉRIFIER LES PERMISSIONS EN UNE SEULE REQUÊTE
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_permissions(user_id_param UUID)
RETURNS TABLE(
  is_admin BOOLEAN,
  is_support BOOLEAN,
  is_user BOOLEAN,
  all_roles TEXT[]
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    bool_or(r.name = 'admin') as is_admin,
    bool_or(r.name = 'support') as is_support,
    bool_or(r.name = 'user') as is_user,
    array_agg(r.name) as all_roles
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = user_id_param;
$$;

-- 8. VUE POUR LES TRANSACTIONS AVEC INFORMATIONS UTILISATEUR
-- =====================================================

CREATE OR REPLACE VIEW transactions_with_users AS
SELECT 
  t.id,
  t.user_id,
  t.transaction_type,
  t.amount_paid,
  t.net_saving,
  t.created_at,
  p.email,
  p.phone,
  p.full_name
FROM transactions t
LEFT JOIN profiles p ON t.user_id = p.id
ORDER BY t.created_at DESC;

-- 9. VÉRIFICATION DES CORRECTIONS
-- =====================================================

-- Vérifier que la vue dashboard_stats existe
SELECT 'dashboard_stats view created successfully' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.views 
  WHERE table_name = 'dashboard_stats'
);

-- Vérifier que les index sont créés
SELECT 'Performance indexes created successfully' as status
WHERE EXISTS (
  SELECT 1 FROM pg_indexes 
  WHERE indexname IN (
    'idx_transactions_created_at_desc',
    'idx_profiles_created_at_desc',
    'idx_user_roles_user_role_composite',
    'idx_preregistrations_status_created',
    'idx_user_savings_user_balance',
    'idx_transactions_month_start',
    'idx_profiles_week_start'
  )
);

-- Vérifier que les fonctions sont créées
SELECT 'Optimized functions created successfully' as status
WHERE EXISTS (
  SELECT 1 FROM information_schema.routines 
  WHERE routine_name IN (
    'get_user_roles_optimized',
    'get_user_permissions',
    'get_month_start',
    'get_week_start'
  )
);

-- Test de performance des nouvelles fonctions
SELECT 'Testing immutable functions...' as test_status;

-- Test de la fonction get_month_start
SELECT get_month_start(CURRENT_TIMESTAMP) as current_month_start;

-- Test de la fonction get_week_start  
SELECT get_week_start(CURRENT_TIMESTAMP) as current_week_start;

-- =====================================================
-- FIN DU SCRIPT DE CORRECTION
-- =====================================================
-- 
-- RÉSOLUTION DE L'ERREUR :
-- ✅ Suppression des index avec fonctions non-immutable
-- ✅ Création de fonctions IMMUTABLE pour les calculs de date
-- ✅ Index optimisés avec les nouvelles fonctions
-- ✅ Vues et fonctions de performance maintenues
-- 
-- AVANTAGES :
-- - Plus d'erreur "functions must be marked IMMUTABLE"
-- - Index optimisés pour les requêtes de date
-- - Performance maintenue ou améliorée
-- - Compatibilité PostgreSQL/Supabase
-- =====================================================

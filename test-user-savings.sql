-- Script de test pour verifier la creation d'epargne par un utilisateur

-- 1. Verifier les types d'epargne disponibles
SELECT 
    'Types d''epargne disponibles:' as test,
    id,
    name,
    interest_rate,
    lock_period_months,
    min_balance,
    active
FROM saving_types
WHERE active = true
ORDER BY interest_rate DESC;

-- 2. Verifier les parametres d'epargne actifs
SELECT 
    'Parametres d''epargne actifs:' as test,
    sp.id,
    st.name as type_epargne,
    sp.saving_rate,
    sp.management_fee,
    sp.effective_from,
    sp.effective_to
FROM saving_parameters sp
JOIN saving_types st ON sp.saving_type_id = st.id
WHERE sp.effective_from <= CURRENT_DATE 
AND (sp.effective_to IS NULL OR sp.effective_to >= CURRENT_DATE)
ORDER BY st.name;

-- 3. Simuler la creation d'une epargne (sans utilisateur reel)
-- Cette requete montre la structure attendue
SELECT 
    'Simulation de creation d''epargne:' as test,
    'user_id' as user_id,
    st.id as saving_type_id,
    0 as balance,
    0 as total_saved,
    0 as total_withdrawn,
    CURRENT_DATE as last_interest_date
FROM saving_types st
WHERE st.active = true
LIMIT 1;

-- 4. Verifier les politiques RLS pour user_savings
SELECT 
    'Politiques RLS pour user_savings:' as test,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'user_savings'
ORDER BY policyname;

-- 5. Verifier que la table user_savings est accessible
SELECT 
    'Structure de user_savings:' as test,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'user_savings'
ORDER BY ordinal_position;

-- 6. Test de la contrainte UNIQUE
SELECT 
    'Contrainte UNIQUE sur user_savings:' as test,
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints
WHERE table_name = 'user_savings'
AND constraint_type = 'UNIQUE';

-- Script de test pour verifier le fonctionnement des epargnes dans l'app mobile

-- 1. Verifier que les types d'epargne sont actifs
SELECT 
    'Types d''epargne actifs:' as test,
    name,
    interest_rate,
    lock_period_months,
    min_balance,
    active
FROM saving_types
WHERE active = true
ORDER BY name;

-- 2. Verifier que les parametres d'epargne sont configures
SELECT 
    'Parametres d''epargne:' as test,
    st.name as type_epargne,
    sp.saving_rate,
    sp.management_fee,
    sp.effective_from
FROM saving_parameters sp
JOIN saving_types st ON sp.saving_type_id = st.id
WHERE sp.effective_from <= CURRENT_DATE 
AND (sp.effective_to IS NULL OR sp.effective_to >= CURRENT_DATE)
ORDER BY st.name;

-- 3. Simuler la creation d'une epargne (test de structure)
SELECT 
    'Test de creation d''epargne:' as test,
    'Structure de la table user_savings' as description,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'user_savings'
ORDER BY ordinal_position;

-- 4. Verifier les contraintes de la table user_savings
SELECT 
    'Contraintes de la table user_savings:' as test,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'user_savings';

-- 5. Test de la logique d'epargne automatique
SELECT 
    'Test de calcul d''epargne automatique:' as test,
    1000 as prix_forfait,
    0.10 as taux_epargne,
    1000 * 0.10 as montant_epargne,
    1000 * 0.10 * 0.01 as frais_gestion,
    1000 * 0.10 - (1000 * 0.10 * 0.01) as epargne_nette,
    'FCFA' as devise;

-- 6. Verifier les politiques RLS pour user_savings
SELECT 
    'Politiques RLS pour user_savings:' as test,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'user_savings';

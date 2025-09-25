-- Test simple pour verifier l'acces aux types d'epargne depuis l'app mobile

-- 1. Verifier que les types d'epargne sont actifs et accessibles
SELECT 
    'Types d''epargne actifs:' as test,
    id,
    name,
    interest_rate,
    lock_period_months,
    min_balance,
    active
FROM saving_types
WHERE active = true
ORDER BY interest_rate DESC;

-- 2. Verifier que les parametres d'epargne sont configures
SELECT 
    'Parametres d''epargne:' as test,
    sp.id,
    st.name as type_epargne,
    sp.saving_rate,
    sp.management_fee
FROM saving_parameters sp
JOIN saving_types st ON sp.saving_type_id = st.id
ORDER BY st.name;

-- 3. Test de la requete exacte utilisee par l'app mobile
SELECT 
    'Test requete mobile:' as test,
    *
FROM saving_types
WHERE active = true
ORDER BY interest_rate DESC;

-- 4. Verifier les permissions RLS
SELECT 
    'Politiques RLS saving_types:' as test,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'saving_types';

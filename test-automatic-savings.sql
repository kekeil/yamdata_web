-- Script de test pour verifier le fonctionnement des epargnes automatiques

-- 1. Verifier que la table automatic_savings existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automatic_savings')
        THEN 'Table automatic_savings existe'
        ELSE 'Table automatic_savings manquante'
    END as status;

-- 2. Verifier que les parametres d'epargne existent
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM saving_parameters)
        THEN 'Parametres d''epargne existent'
        ELSE 'Parametres d''epargne manquants'
    END as status;

-- 3. Afficher les parametres d'epargne actuels
SELECT 
    st.name as type_epargne,
    sp.saving_rate,
    sp.management_fee,
    sp.effective_from
FROM saving_parameters sp
JOIN saving_types st ON sp.saving_type_id = st.id
WHERE sp.active = true OR sp.active IS NULL
ORDER BY st.name;

-- 4. Verifier que les types d'epargne existent
SELECT 
    name,
    interest_rate,
    lock_period_months,
    active
FROM saving_types
ORDER BY name;

-- 5. Tester la fonction d'epargne automatique (simulation)
SELECT 
    'Test de la logique d''epargne automatique' as test_description,
    1000 as prix_forfait,
    0.10 as taux_epargne,
    1000 * 0.10 as montant_epargne,
    1000 * 0.10 * 0.01 as frais_gestion,
    1000 * 0.10 - (1000 * 0.10 * 0.01) as epargne_nette;

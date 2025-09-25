-- Script pour corriger les paramètres d'épargne

-- 1. Vérifier les paramètres existants
SELECT 'Paramètres existants:' as info;
SELECT * FROM saving_parameters ORDER BY effective_from DESC;

-- 2. Créer des paramètres par défaut pour chaque type d'épargne
INSERT INTO saving_parameters (saving_type_id, saving_rate, management_fee, effective_from, active)
SELECT 
    st.id,
    CASE 
        WHEN st.name = 'libre' THEN 0.1      -- 10% pour épargne libre
        WHEN st.name = 'semi-bloquée' THEN 0.15  -- 15% pour épargne semi-bloquée
        WHEN st.name = 'bloquée' THEN 0.2   -- 20% pour épargne bloquée
        ELSE 0.1
    END as saving_rate,
    0.01 as management_fee,  -- 1% de frais de gestion
    CURRENT_DATE as effective_from,
    true as active
FROM saving_types st
WHERE st.active = true
AND NOT EXISTS (
    SELECT 1 FROM saving_parameters sp 
    WHERE sp.saving_type_id = st.id 
    AND sp.active = true
);

-- 3. Vérifier les paramètres créés
SELECT 'Paramètres après correction:' as info;
SELECT 
    sp.*,
    st.name as saving_type_name
FROM saving_parameters sp
JOIN saving_types st ON sp.saving_type_id = st.id
ORDER BY sp.effective_from DESC, st.name;

-- 4. Vérifier les politiques RLS pour saving_parameters
SELECT 'Politiques RLS pour saving_parameters:' as info;
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'saving_parameters'
ORDER BY policyname;

-- Script simplifié pour corriger les paramètres d'épargne

-- 1. Vérifier les paramètres existants
SELECT 'Paramètres existants:' as info;
SELECT 
    sp.*,
    st.name as saving_type_name
FROM saving_parameters sp
JOIN saving_types st ON sp.saving_type_id = st.id
ORDER BY sp.effective_from DESC;

-- 2. Supprimer les anciens paramètres s'ils existent
DELETE FROM saving_parameters;

-- 3. Créer de nouveaux paramètres pour chaque type d'épargne
INSERT INTO saving_parameters (saving_type_id, saving_rate, management_fee, effective_from)
VALUES 
    (1, 0.2, 0.01, CURRENT_DATE),   -- Épargne bloquée: 20%
    (2, 0.15, 0.01, CURRENT_DATE),  -- Épargne semi-bloquée: 15%
    (3, 0.1, 0.01, CURRENT_DATE);   -- Épargne libre: 10%

-- 4. Vérifier les paramètres créés
SELECT 'Paramètres après correction:' as info;
SELECT 
    sp.*,
    st.name as saving_type_name,
    CONCAT((sp.saving_rate * 100)::text, '%') as saving_rate_percent
FROM saving_parameters sp
JOIN saving_types st ON sp.saving_type_id = st.id
ORDER BY sp.saving_rate DESC;

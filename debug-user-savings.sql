-- Script pour déboguer les épargnes utilisateur

-- 1. Vérifier les épargnes d'un utilisateur spécifique
SELECT 'Épargnes utilisateur:' as info;
SELECT 
    us.id,
    us.user_id,
    us.balance,
    us.total_saved,
    us.total_withdrawn,
    st.name as saving_type_name,
    st.interest_rate,
    us.created_at
FROM user_savings us
JOIN saving_types st ON us.saving_type_id = st.id
WHERE us.user_id = 'bec1f3ce-7401-4aad-a76b-aa45ea64d7ac'  -- Remplacez par l'ID de votre utilisateur
ORDER BY us.created_at DESC;

-- 2. Vérifier les paramètres d'épargne
SELECT 'Paramètres d\'épargne:' as info;
SELECT 
    sp.*,
    st.name as saving_type_name
FROM saving_parameters sp
JOIN saving_types st ON sp.saving_type_id = st.id
WHERE sp.active = true
ORDER BY sp.effective_from DESC;

-- 3. Vérifier les transactions récentes
SELECT 'Transactions récentes:' as info;
SELECT 
    t.id,
    t.user_id,
    t.amount_paid,
    t.saving_amount,
    t.management_fee_rate,
    t.created_at
FROM transactions t
WHERE t.user_id = 'bec1f3ce-7401-4aad-a76b-aa45ea64d7ac'  -- Remplacez par l'ID de votre utilisateur
ORDER BY t.created_at DESC
LIMIT 5;

-- 4. Vérifier les politiques RLS pour user_savings
SELECT 'Politiques RLS user_savings:' as info;
SELECT policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'user_savings'
ORDER BY policyname;

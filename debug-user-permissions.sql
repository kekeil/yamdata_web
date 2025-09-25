-- Script de debug pour verifier les permissions utilisateur

-- 1. Verifier les utilisateurs connectes (si possible)
SELECT 
    'Utilisateurs dans auth.users:' as test,
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 2. Verifier les profils utilisateurs
SELECT 
    'Profils utilisateurs:' as test,
    id,
    email,
    full_name,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verifier les roles utilisateurs
SELECT 
    'Roles utilisateurs:' as test,
    p.email,
    r.name as role_name,
    ur.assigned_at
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
JOIN roles r ON ur.role_id = r.id
ORDER BY ur.assigned_at DESC;

-- 4. Verifier les epargnes existantes
SELECT 
    'Epargnes existantes:' as test,
    us.id,
    p.email,
    st.name as type_epargne,
    us.balance,
    us.created_at
FROM user_savings us
JOIN profiles p ON us.user_id = p.id
JOIN saving_types st ON us.saving_type_id = st.id
ORDER BY us.created_at DESC
LIMIT 10;

-- 5. Test de la fonction is_user_admin
SELECT 
    'Test de la fonction is_user_admin:' as test,
    p.email,
    is_user_admin(p.id) as is_admin
FROM profiles p
LIMIT 5;

-- 6. Test de la fonction has_role
SELECT 
    'Test de la fonction has_role:' as test,
    p.email,
    has_role(p.id, 'user') as is_user,
    has_role(p.id, 'admin') as is_admin,
    has_role(p.id, 'support') as is_support
FROM profiles p
LIMIT 5;

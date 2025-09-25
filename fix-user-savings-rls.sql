-- Script pour corriger les politiques RLS de la table user_savings

-- 1. Supprimer les politiques existantes
DROP POLICY IF EXISTS "user_savings_select_self" ON user_savings;
DROP POLICY IF EXISTS "user_savings_admin" ON user_savings;
DROP POLICY IF EXISTS "user_savings_support_select" ON user_savings;

-- 2. Creer les nouvelles politiques RLS correctes
-- Politique pour que les utilisateurs puissent voir leurs propres epargnes
CREATE POLICY "Users can view their own savings" ON user_savings
    FOR SELECT USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs puissent creer leurs propres epargnes
CREATE POLICY "Users can create their own savings" ON user_savings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique pour que les utilisateurs puissent mettre a jour leurs propres epargnes
CREATE POLICY "Users can update their own savings" ON user_savings
    FOR UPDATE USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs puissent supprimer leurs propres epargnes
CREATE POLICY "Users can delete their own savings" ON user_savings
    FOR DELETE USING (auth.uid() = user_id);

-- Politique pour les admins (acces complet)
CREATE POLICY "Admins can manage all savings" ON user_savings
    FOR ALL USING (is_user_admin(auth.uid()));

-- Politique pour le support (lecture seule)
CREATE POLICY "Support can view all savings" ON user_savings
    FOR SELECT USING (has_role(auth.uid(), 'support'));

-- 3. Verifier que les politiques sont bien creees
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

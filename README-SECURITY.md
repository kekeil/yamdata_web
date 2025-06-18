# Sécurité de la Base de Données Yamdata

Ce document détaille les mécanismes de sécurité implémentés dans la base de données Yamdata pour garantir la protection des données, la confidentialité des utilisateurs et l'intégrité du système.

## 1. Row Level Security (RLS)

La sécurité au niveau des lignes (RLS) est la pierre angulaire de notre stratégie de sécurité, permettant de restreindre l'accès aux données selon l'identité de l'utilisateur connecté.

### Principe de fonctionnement

Le RLS fonctionne selon le principe du moindre privilège :
- Chaque table sensible possède des politiques de sécurité RLS
- Ces politiques définissent des conditions d'accès (SELECT, INSERT, UPDATE, DELETE)
- L'identifiant de l'utilisateur connecté (`auth.uid()`) est utilisé comme critère de filtrage

### Résolution des problèmes de récursion

Pour éviter le problème de récursion infinie dans les politiques RLS (qui peut survenir lorsque des politiques s'appellent mutuellement), nous utilisons :

1. Des fonctions `SECURITY DEFINER` qui s'exécutent avec les privilèges du créateur et contournent les politiques RLS
2. Une architecture en couches pour les vérifications d'autorisation

### Politiques par type d'utilisateur

#### Utilisateurs standards
```sql
-- Exemple: politique pour les profils utilisateurs (ils ne voient que leur profil)
CREATE POLICY user_select_self ON public.profiles
  FOR SELECT USING (id = auth.uid());
  
-- Exemple: politique pour les abonnements (ils ne voient que leurs abonnements)
CREATE POLICY user_view_own_subscriptions ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());
```

#### Administrateurs
```sql
-- Exemple: politique pour l'accès administrateur complet
CREATE POLICY admin_all ON public.profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM has_role(auth.uid(), 'admin') WHERE has_role = true
    )
  );
```

#### Support
```sql
-- Exemple: politique pour le support (lecture seule sur certaines tables)
CREATE POLICY support_view_all ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM has_role(auth.uid(), 'support') WHERE has_role = true
    )
  );
```

## 2. Fonctions de Sécurité Privilégiées

Les fonctions `SECURITY DEFINER` sont essentielles pour éviter les problèmes de récursion RLS tout en maintenant un haut niveau de sécurité.

### is_user_admin

```sql
CREATE OR REPLACE FUNCTION is_user_admin(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id_param
    AND r.name = 'admin'
  );
$$;
```

Cette fonction vérifie si un utilisateur a le rôle admin, en s'exécutant avec les privilèges élevés du créateur de la fonction (généralement le propriétaire de la base de données).

### has_role

```sql
CREATE OR REPLACE FUNCTION has_role(user_id_param UUID, role_name_param TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = user_id_param
    AND r.name = role_name_param
  );
$$;
```

Cette fonction permet de vérifier de manière sécurisée si un utilisateur possède un rôle spécifique.

## 3. Bonnes Pratiques Implémentées

### Données sensibles

1. **Hachage des mots de passe** : Géré automatiquement par Supabase Auth
2. **Champs sensibles** : Minimisés dans la base de données
3. **Métadonnées en JSONB** : Permet de stocker des informations supplémentaires sans exposer la structure

### Audit et traçabilité

1. **Horodatage automatique** : Toutes les tables incluent `created_at` et `updated_at`
2. **Historique des modifications** : Certaines tables importantes conservent un historique des changements
3. **Références aux auteurs** : Les actions administratives (comme l'attribution de rôles) conservent une référence à l'auteur

### Paramètres de connexion

1. **Limite de tentatives** : Géré par Supabase Auth
2. **Durée de session configurable** : Permet d'ajuster la sécurité selon les besoins
3. **JWT avec durée de vie limitée** : Les tokens d'authentification expirent automatiquement

## 4. Transactions et Intégrité

### Atomicité des opérations critiques

Les opérations critiques comme les paiements et l'épargne utilisent des transactions SQL pour garantir l'atomicité :

```sql
BEGIN;
  -- Débit du compte
  UPDATE accounts SET balance = balance - amount WHERE id = account_id;
  
  -- Création de la transaction
  INSERT INTO transactions (...) VALUES (...);
  
  -- Autres opérations
COMMIT;
```

### Déclencheurs pour l'intégrité référentielle

Des déclencheurs (triggers) garantissent l'intégrité des données même lors d'opérations complexes :

```sql
CREATE TRIGGER trg_transaction_after_insert
AFTER INSERT ON transactions
FOR EACH ROW
EXECUTE FUNCTION update_savings_balance();
```

## 5. Protection contre les attaques courantes

### Injection SQL

- Utilisation de requêtes paramétrées
- Validation des entrées
- Échappement automatique des chaînes par Supabase

### XSS et CSRF

- Gestion par Supabase Auth et les mécanismes de JWT
- Validation stricte des données côté serveur avant insertion

### Élévation de privilèges

- Vérifications strictes des rôles via fonctions SECURITY DEFINER
- Séparation claire des responsabilités dans les politiques RLS

## 6. Recommandations d'utilisation

1. **Toujours utiliser les API sécurisées** plutôt que d'accéder directement à la base de données
2. **Vérifier les rôles** avant d'effectuer des opérations sensibles
3. **Utiliser les fonctions fournies** (`is_user_admin`, `has_role`) pour les vérifications d'autorisation
4. **Ne pas contourner les politiques RLS** sauf si absolument nécessaire, et uniquement via des fonctions SECURITY DEFINER bien auditées
5. **Surveiller régulièrement** les journaux d'accès et d'authentification

## 7. Configuration de Supabase

### Extensions recommandées

```sql
-- Extensions déjà activées
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Extensions supplémentaires recommandées
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements"; -- Pour l'analyse des performances
CREATE EXTENSION IF NOT EXISTS "pgjwt"; -- Pour la gestion des JWT si nécessaire
```

### Paramètres de sécurité Supabase

Dans le tableau de bord Supabase :

1. **Authentication** > **Settings** :
   - Configurer la durée de vie des sessions
   - Activer la confirmation par email
   - Configurer les restrictions d'adresse IP si nécessaire

2. **Database** > **Roles** :
   - Vérifier les privilèges des rôles par défaut
   - Limiter les autorisations du rôle anonymous

3. **API** :
   - Limiter les requêtes par IP
   - Configurer CORS approprié 
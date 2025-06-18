# Requêtes SQL utiles pour Yamdata

Ce document contient des exemples de requêtes SQL que vous pouvez utiliser pour exploiter votre base de données Yamdata. Ces requêtes sont organisées par cas d'utilisation.

## Requêtes administratives

### Lister tous les utilisateurs avec leurs rôles

```sql
SELECT 
  p.id, 
  p.email, 
  p.full_name,
  string_agg(r.name, ', ') AS roles
FROM 
  profiles p
LEFT JOIN 
  user_roles ur ON p.id = ur.user_id
LEFT JOIN 
  roles r ON ur.role_id = r.id
GROUP BY 
  p.id, p.email, p.full_name
ORDER BY 
  p.created_at DESC;
```

### Attribuer le rôle admin à un utilisateur

```sql
-- Option 1: Via fonction
SELECT add_admin_role('ID-UTILISATEUR-UUID');

-- Option 2: Via insertion directe
INSERT INTO user_roles (user_id, role_id)
SELECT 
  'ID-UTILISATEUR-UUID', 
  id
FROM 
  roles 
WHERE 
  name = 'admin'
ON CONFLICT (user_id, role_id) DO NOTHING;
```

### Vérifier si un utilisateur est admin

```sql
SELECT is_user_admin('ID-UTILISATEUR-UUID');
```

## Gestion des forfaits

### Ajouter un nouveau forfait

```sql
INSERT INTO data_plans 
  (operator_id, name, volume_go, price, validity_days, active) 
VALUES 
  (
    (SELECT id FROM telecom_operators WHERE name = 'Orange'),
    'Internet 5Go', 
    5, 
    5000, 
    30,
    true
  );
```

### Récupérer les forfaits populaires par opérateur

```sql
SELECT 
  dp.*,
  op.name AS operator_name,
  COUNT(s.id) AS subscription_count
FROM 
  data_plans dp
JOIN 
  telecom_operators op ON dp.operator_id = op.id
LEFT JOIN 
  subscriptions s ON dp.id = s.plan_id AND s.status = 'active'
WHERE 
  dp.active = true
GROUP BY 
  dp.id, op.name
ORDER BY 
  op.name, subscription_count DESC, dp.price ASC;
```

### Désactiver un forfait obsolète

```sql
UPDATE data_plans
SET active = false, updated_at = now()
WHERE id = 123;
```

## Gestion des abonnements

### Lister les abonnements actifs d'un utilisateur

```sql
SELECT 
  s.id AS subscription_id,
  dp.name AS plan_name,
  op.name AS operator,
  dp.volume_go,
  s.start_date,
  s.end_date,
  s.status
FROM 
  subscriptions s
JOIN 
  data_plans dp ON s.plan_id = dp.id
JOIN 
  telecom_operators op ON dp.operator_id = op.id
WHERE 
  s.user_id = 'ID-UTILISATEUR-UUID'
  AND s.status = 'active'
ORDER BY 
  s.end_date ASC;
```

### Créer un nouvel abonnement

```sql
INSERT INTO subscriptions 
  (user_id, plan_id, status, start_date, end_date, metadata)
VALUES 
  (
    'ID-UTILISATEUR-UUID',
    123, -- ID du forfait
    'pending',
    now(),
    now() + interval '30 day',
    '{"source": "web", "promo_code": "WELCOME"}'
  )
RETURNING id;
```

### Marquer un abonnement comme actif après paiement

```sql
UPDATE subscriptions
SET 
  status = 'active',
  updated_at = now(),
  metadata = jsonb_set(metadata, '{payment_confirmed}', 'true')
WHERE 
  id = 456
  AND status = 'pending';
```

## Gestion de l'épargne

### Créer un compte d'épargne pour un nouvel utilisateur

```sql
INSERT INTO savings_accounts 
  (user_id, balance, type, interest_rate, metadata)
VALUES 
  (
    'ID-UTILISATEUR-UUID',
    0.00,
    'free',
    (SELECT default_interest_rate FROM savings_settings WHERE id = 1),
    '{}'
  );
```

### Ajouter une épargne automatique lors d'un achat de forfait

```sql
-- Insérer la transaction d'épargne
INSERT INTO transactions 
  (user_id, type, amount, status, reference, metadata)
VALUES 
  (
    'ID-UTILISATEUR-UUID',
    'savings',
    500.00, -- Montant d'épargne
    'completed',
    'SAVE-' || uuid_generate_v4(),
    '{"source": "automatic", "from_subscription": 123}'
  );

-- Le solde d'épargne sera mis à jour automatiquement par le déclencheur
```

### Obtenir le résumé des épargnes d'un utilisateur

```sql
SELECT * FROM user_savings_summary
WHERE user_id = 'ID-UTILISATEUR-UUID';
```

## Rapports et statistiques

### Résumé des ventes par jour sur le mois en cours

```sql
SELECT 
  DATE(created_at) AS day,
  COUNT(*) AS transactions_count,
  SUM(amount) AS total_amount
FROM 
  transactions
WHERE 
  type = 'purchase'
  AND status = 'completed'
  AND created_at >= date_trunc('month', current_date)
GROUP BY 
  DATE(created_at)
ORDER BY 
  day DESC;
```

### Épargne totale par type d'épargne

```sql
SELECT 
  type,
  COUNT(*) AS accounts_count,
  SUM(balance) AS total_balance,
  AVG(balance) AS average_balance
FROM 
  savings_accounts
GROUP BY 
  type
ORDER BY 
  total_balance DESC;
```

### Forfaits les plus vendus ce mois-ci

```sql
SELECT 
  dp.name AS plan_name,
  op.name AS operator,
  COUNT(*) AS subscriptions_count,
  SUM(dp.price) AS total_revenue
FROM 
  subscriptions s
JOIN 
  data_plans dp ON s.plan_id = dp.id
JOIN 
  telecom_operators op ON dp.operator_id = op.id
WHERE 
  s.created_at >= date_trunc('month', current_date)
  AND s.status IN ('active', 'expired')
GROUP BY 
  dp.name, op.name
ORDER BY 
  subscriptions_count DESC
LIMIT 10;
```

## Maintenance et dépannage

### Supprimer les données utilisateur (GDPR)

```sql
-- Cette requête supprimera toutes les données liées à l'utilisateur
-- grâce aux contraintes ON DELETE CASCADE
DELETE FROM profiles
WHERE id = 'ID-UTILISATEUR-UUID';
```

### Trouver les transactions en échec

```sql
SELECT 
  id,
  user_id,
  type,
  amount,
  created_at,
  metadata
FROM 
  transactions
WHERE 
  status = 'failed'
  AND created_at > now() - interval '7 days'
ORDER BY 
  created_at DESC;
```

### Vérifier les abonnements expirés non marqués

```sql
SELECT 
  id,
  user_id,
  plan_id,
  end_date
FROM 
  subscriptions
WHERE 
  status = 'active'
  AND end_date < now();
```

### Corriger les soldes d'épargne incorrects

```sql
-- Recalculer le solde d'épargne pour un utilisateur spécifique
WITH user_transactions AS (
  SELECT 
    user_id,
    SUM(CASE WHEN type = 'savings' THEN amount
             WHEN type = 'withdrawal' THEN -amount
             ELSE 0 END) AS calculated_balance
  FROM 
    transactions
  WHERE 
    user_id = 'ID-UTILISATEUR-UUID'
    AND status = 'completed'
  GROUP BY 
    user_id
)
UPDATE 
  savings_accounts sa
SET 
  balance = ut.calculated_balance,
  updated_at = now()
FROM 
  user_transactions ut
WHERE 
  sa.user_id = ut.user_id
  AND sa.balance != ut.calculated_balance;
``` 
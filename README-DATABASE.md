# Documentation de la Base de Données Yamdata

Cette documentation explique en détail la structure de la base de données PostgreSQL/Supabase pour l'application Yamdata, une plateforme qui permet aux utilisateurs d'acheter des forfaits internet tout en épargnant automatiquement.

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Structure des tables](#structure-des-tables)
3. [Fonctions de sécurité](#fonctions-de-sécurité)
4. [Politiques RLS](#politiques-rls)
5. [Vues](#vues)
6. [Déclencheurs](#déclencheurs)
7. [Indexation](#indexation)

## Vue d'ensemble

La base de données Yamdata est conçue pour:
- Gérer les utilisateurs et leurs rôles (admin, user, support)
- Stocker les informations sur les opérateurs télécom et leurs forfaits
- Gérer les abonnements aux forfaits
- Suivre les transactions financières
- Gérer les épargnes des utilisateurs
- Appliquer la sécurité au niveau des lignes (RLS) pour protéger les données

## Structure des tables

### Utilisateurs et rôles

1. **profiles**
   - Extension de la table auth.users de Supabase
   - Stocke les informations de profil utilisateur (nom, email, téléphone)
   - Clé primaire: id (UUID lié à auth.users)

2. **roles**
   - Définit les rôles système (admin, user, support)
   - Inclut les permissions sous forme de JSONB
   - Clé primaire: id (SERIAL)

3. **user_roles**
   - Relation many-to-many entre profiles et roles
   - Permet d'attribuer plusieurs rôles à un utilisateur
   - Clé primaire composée: (user_id, role_id)

### Opérateurs et forfaits

4. **telecom_operators**
   - Liste des opérateurs télécom (Telecel, Orange, Moov)
   - Stocke les taux de commission par opérateur
   - Clé primaire: id (SERIAL)

5. **data_plans**
   - Forfaits internet disponibles
   - Inclut volume, prix, validité, opérateur
   - Statut actif/inactif pour gérer la disponibilité
   - Clé primaire: id (SERIAL)

### Abonnements et épargne

6. **subscriptions**
   - Abonnements utilisateur aux forfaits
   - Statut (pending, active, cancelled, expired)
   - Date de début/fin et métadonnées
   - Clé primaire: id (SERIAL)

7. **savings_settings**
   - Paramètres globaux d'épargne
   - Taux d'épargne par défaut et frais de service
   - Clé primaire: id (SERIAL)

8. **savings_accounts**
   - Comptes d'épargne des utilisateurs
   - Solde actuel et historique
   - Type d'épargne (blocked, semi_blocked, free)
   - Clé primaire: id (UUID)

9. **savings_goals**
   - Objectifs d'épargne définis par les utilisateurs
   - Montant cible et progression
   - Clé primaire: id (UUID)

### Transactions

10. **transactions**
    - Enregistre toutes les transactions financières
    - Types: purchase, savings, withdrawal, refund
    - Statut et métadonnées de la transaction
    - Clé primaire: id (UUID)

11. **payment_methods**
    - Méthodes de paiement disponibles
    - Type (mobile_money, card, bank_transfer)
    - Clé primaire: id (SERIAL)

## Fonctions de sécurité

### Fonctions utilitaires

- **update_modified_column()**
  - Fonction déclencheur qui met à jour automatiquement le champ updated_at
  - Utilisée pour maintenir l'horodatage des modifications

### Fonctions de sécurité (SECURITY DEFINER)

- **is_user_admin(user_id_param UUID)**
  - Vérifie si un utilisateur a le rôle admin
  - Utilise SECURITY DEFINER pour contourner les restrictions RLS

- **has_role(user_id_param UUID, role_name_param TEXT)**
  - Vérifie si un utilisateur a un rôle spécifique
  - Utilisée pour les vérifications d'autorisation

- **add_admin_role(user_id_param UUID)**
  - Ajoute le rôle admin à un utilisateur
  - Inclut la gestion des erreurs et vérification des doublons

## Politiques RLS

La sécurité au niveau des lignes (Row-Level Security) est mise en place pour contrôler l'accès aux données:

### Profiles

- Les utilisateurs peuvent lire leur propre profil uniquement
- Les administrateurs peuvent gérer tous les profils
- Le support peut voir tous les profils mais ne peut pas les modifier

### Roles et User_Roles

- Seuls les administrateurs peuvent gérer les rôles
- Lecture limitée pour le support, aucun accès pour les utilisateurs standards

### Data Plans et Telecom Operators

- Tous les utilisateurs peuvent lire les forfaits actifs
- Seuls les administrateurs peuvent créer/modifier/supprimer des forfaits
- Accès en lecture seule pour le support

### Subscriptions et Savings

- Les utilisateurs peuvent voir uniquement leurs propres abonnements et épargnes
- Les administrateurs peuvent voir et gérer toutes les données
- Le support peut voir toutes les données mais avec des capacités de modification limitées

### Transactions

- Les utilisateurs peuvent voir uniquement leurs propres transactions
- Les administrateurs ont un accès complet
- Le support peut voir toutes les transactions pour le support client

## Vues

- **active_subscriptions**
  - Liste tous les abonnements actifs avec informations de forfait et utilisateur
  
- **popular_data_plans**
  - Agrège les forfaits par popularité (nombre d'abonnements)

- **user_savings_summary**
  - Résumé des épargnes par utilisateur avec statistiques

## Déclencheurs

- **trg_profiles_updated_at**
  - Met à jour le champ updated_at lors de modifications de profils

- **trg_transaction_after_insert**
  - Met à jour automatiquement les soldes d'épargne après insertion de transaction

- **trg_subscription_expiry**
  - Marque automatiquement les abonnements comme expirés à leur date de fin

## Indexation

Des index sont créés sur les clés étrangères et les colonnes fréquemment utilisées dans les requêtes:

- Index sur user_id dans toutes les tables liées aux utilisateurs
- Index sur les dates de création pour les recherches temporelles
- Index sur les statuts pour les filtres fréquents

## Bénéfices de cette architecture

1. **Sécurité renforcée**
   - Isolation des données par utilisateur via RLS
   - Fonctions privilégiées pour les opérations sensibles

2. **Performance optimisée**
   - Indexation stratégique
   - Vues pour les requêtes complexes fréquentes

3. **Intégrité des données**
   - Contraintes de clés étrangères
   - Déclencheurs pour maintenir la cohérence

4. **Flexibilité**
   - Structure extensible pour de futures fonctionnalités
   - Métadonnées en JSONB pour stocker des informations variables 
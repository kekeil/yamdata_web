-- YAMDATA - SCHÉMA SQL COMPLET
-- Base de données optimisée pour Supabase
-- Plateforme d'achat de forfaits internet avec épargne automatique

----------------------------------------------------------------------
-- 1. CONFIGURATION INITIALE
----------------------------------------------------------------------

-- Activation de l'extension UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

----------------------------------------------------------------------
-- 2. FONCTIONS UTILITAIRES DE BASE
----------------------------------------------------------------------

-- Déclencheur pour maintenir updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

----------------------------------------------------------------------
-- 3. UTILISATEURS ET RÔLES
----------------------------------------------------------------------

-- Table des profils utilisateurs
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Rôles système
CREATE TABLE public.roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (name IN ('admin', 'user', 'support')),
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'
);

-- Attribution des rôles aux utilisateurs (many-to-many)
CREATE TABLE public.user_roles (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id INT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES public.profiles(id),
  PRIMARY KEY (user_id, role_id)
);

-- Indexation
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);

-- Insertion des rôles de base
INSERT INTO public.roles (name, description, permissions) VALUES 
('admin', 'Administrateur système avec accès complet', '{"all": true}'),
('user', 'Utilisateur standard', '{"read": true, "create_transactions": true}'),
('support', 'Agent support client', '{"read": true, "support_actions": true}')
ON CONFLICT (name) DO NOTHING;

----------------------------------------------------------------------
-- 4. FONCTIONS DE SÉCURITÉ (SECURITY DEFINER)
----------------------------------------------------------------------

-- Fonction pour vérifier si un utilisateur est admin (sans récursion RLS)
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

-- Fonction pour vérifier si un utilisateur a un rôle spécifique
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

-- Fonction pour ajouter un rôle admin à un utilisateur
CREATE OR REPLACE FUNCTION add_admin_role(user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role_id INT;
BEGIN
  -- Récupérer l'ID du rôle admin
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin';
  
  -- Vérifier si l'utilisateur a déjà le rôle
  IF EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_id_param AND role_id = admin_role_id
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Ajouter le rôle admin
  INSERT INTO user_roles (user_id, role_id)
  VALUES (user_id_param, admin_role_id);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

----------------------------------------------------------------------
-- 5. OPÉRATEURS TÉLÉCOM ET FORFAITS
----------------------------------------------------------------------

CREATE TABLE public.telecom_operators (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (name IN ('Telecel', 'Orange', 'Moov')),
  logo_url TEXT,
  commission_rate NUMERIC(5,4) NOT NULL CHECK (commission_rate >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_operators_updated_at
BEFORE UPDATE ON public.telecom_operators
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TABLE public.data_plans (
  id SERIAL PRIMARY KEY,
  operator_id INT NOT NULL REFERENCES public.telecom_operators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  volume_mb INT NOT NULL CHECK (volume_mb > 0),
  price NUMERIC(12,2) NOT NULL CHECK (price > 0),
  validity_days INT NOT NULL CHECK (validity_days > 0),
  is_popular BOOLEAN DEFAULT false,
  active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (operator_id, name)
);

CREATE TRIGGER trg_data_plans_updated_at
BEFORE UPDATE ON public.data_plans
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_data_plans_operator_id ON public.data_plans(operator_id);
CREATE INDEX idx_data_plans_price ON public.data_plans(price);
CREATE INDEX idx_data_plans_volume ON public.data_plans(volume_mb);

-- Insertion des opérateurs de base
INSERT INTO public.telecom_operators (name, commission_rate) VALUES
('Telecel', 0.05),
('Orange', 0.05),
('Moov', 0.05)
ON CONFLICT (name) DO NOTHING;

----------------------------------------------------------------------
-- 6. TYPES D'ÉPARGNE ET PARAMÈTRES
----------------------------------------------------------------------

CREATE TABLE public.saving_types (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (name IN ('bloquée', 'semi-bloquée', 'libre')),
  description TEXT,
  lock_period_months INT NOT NULL DEFAULT 0 CHECK (lock_period_months >= 0),
  withdrawal_frequency TEXT NOT NULL,
  interest_rate NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (interest_rate >= 0),
  min_balance NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (min_balance >= 0),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_saving_types_updated_at
BEFORE UPDATE ON public.saving_types
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TABLE public.saving_parameters (
  id SERIAL PRIMARY KEY,
  saving_type_id INT NOT NULL REFERENCES public.saving_types(id) ON DELETE CASCADE,
  saving_rate NUMERIC(4,3) NOT NULL CHECK (saving_rate BETWEEN 0.01 AND 0.9),
  management_fee NUMERIC(4,3) NOT NULL CHECK (management_fee >= 0),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_date_range CHECK (effective_to IS NULL OR effective_to > effective_from)
);

CREATE TRIGGER trg_saving_parameters_updated_at
BEFORE UPDATE ON public.saving_parameters
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_saving_parameters_type_id ON public.saving_parameters(saving_type_id);
CREATE INDEX idx_saving_parameters_effective ON public.saving_parameters(effective_from, effective_to);

-- Insertion des types d'épargne de base
INSERT INTO public.saving_types (name, description, lock_period_months, withdrawal_frequency, interest_rate) VALUES
('bloquée', 'Épargne bloquée pour une période fixe avec rendement élevé', 12, 'Après période de blocage', 0.05),
('semi-bloquée', 'Épargne avec retrait limité et rendement moyen', 6, 'Trimestrielle', 0.03),
('libre', 'Épargne avec retrait libre et rendement faible', 0, 'À tout moment', 0.01)
ON CONFLICT (name) DO NOTHING;

-- Paramètres d'épargne initiaux
INSERT INTO public.saving_parameters (saving_type_id, saving_rate, management_fee) 
SELECT id, 
  CASE 
    WHEN name = 'bloquée' THEN 0.15
    WHEN name = 'semi-bloquée' THEN 0.10
    ELSE 0.05
  END as saving_rate,
  0.01 as management_fee
FROM public.saving_types
ON CONFLICT DO NOTHING;

----------------------------------------------------------------------
-- 7. ÉPARGNES UTILISATEURS
----------------------------------------------------------------------

CREATE TABLE public.user_savings (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  saving_type_id INT NOT NULL REFERENCES public.saving_types(id) ON DELETE CASCADE,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_saved NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_saved >= 0),
  total_withdrawn NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_withdrawn >= 0),
  last_interest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, saving_type_id)
);

CREATE TRIGGER trg_user_savings_updated_at
BEFORE UPDATE ON public.user_savings
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_user_savings_user_id ON public.user_savings(user_id);
CREATE INDEX idx_user_savings_type_id ON public.user_savings(saving_type_id);
CREATE INDEX idx_user_savings_balance ON public.user_savings(balance);

----------------------------------------------------------------------
-- 8. ABONNEMENTS ET HISTORIQUE
----------------------------------------------------------------------

CREATE TABLE public.subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_id INT NOT NULL REFERENCES public.data_plans(id) ON DELETE CASCADE,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expiration_date TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
  transaction_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan_id ON public.subscriptions(plan_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_expiration ON public.subscriptions(expiration_date);

-- Historique des abonnements pour audit
CREATE TABLE public.subscriptions_history (
  history_id BIGSERIAL PRIMARY KEY,
  subscription_id INT NOT NULL,
  user_id UUID NOT NULL,
  plan_id INT NOT NULL,
  event TEXT NOT NULL,
  details JSONB,
  event_time TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_history_subscription_id ON public.subscriptions_history(subscription_id);
CREATE INDEX idx_subscriptions_history_user_id ON public.subscriptions_history(user_id);

----------------------------------------------------------------------
-- 9. TRANSACTIONS
----------------------------------------------------------------------

CREATE TABLE public.transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'withdrawal', 'deposit', 'interest')),
  amount_paid NUMERIC(12,2) NOT NULL CHECK (amount_paid >= 0),
  data_cost NUMERIC(12,2) NOT NULL CHECK (data_cost >= 0),
  saving_amount NUMERIC(12,2) NOT NULL CHECK (saving_amount >= 0),
  management_fee_rate NUMERIC(4,3) NOT NULL CHECK (management_fee_rate >= 0),
  management_fee_amount NUMERIC(12,2) GENERATED ALWAYS AS (saving_amount * management_fee_rate) STORED,
  net_saving NUMERIC(12,2) GENERATED ALWAYS AS (saving_amount - (saving_amount * management_fee_rate)) STORED,
  reference_id TEXT,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  payment_method TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Indexation
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX idx_transactions_status ON public.transactions(status);

----------------------------------------------------------------------
-- 10. DÉCLENCHEURS FONCTIONNELS
----------------------------------------------------------------------

-- Déclencheur pour enregistrer l'historique des abonnements
CREATE OR REPLACE FUNCTION public.log_subscription_change() 
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.subscriptions_history(
      subscription_id, user_id, plan_id, event, details, event_time
    ) VALUES (
      OLD.id, OLD.user_id, OLD.plan_id, 'DELETE', 
      jsonb_build_object(
        'expiration_date', OLD.expiration_date,
        'status', OLD.status
      ),
      now()
    );
    RETURN OLD;
  ELSE
    INSERT INTO public.subscriptions_history(
      subscription_id, user_id, plan_id, event, details, event_time
    ) VALUES (
      NEW.id, NEW.user_id, NEW.plan_id, TG_OP, 
      jsonb_build_object(
        'expiration_date', NEW.expiration_date,
        'status', NEW.status
      ),
      now()
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_subscriptions_audit
AFTER INSERT OR UPDATE OR DELETE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.log_subscription_change();

-- Déclencheur pour appliquer l'épargne lors d'une transaction
CREATE OR REPLACE FUNCTION public.apply_transaction_savings()
RETURNS TRIGGER AS $$
DECLARE 
  default_saving_type_id INT;
  user_saving_record RECORD;
BEGIN
  -- Ignorer les retraits et autres types ne générant pas d'épargne
  IF NEW.transaction_type NOT IN ('purchase', 'deposit') THEN
    RETURN NEW;
  END IF;
  
  -- Obtenir le type d'épargne par défaut (libre)
  SELECT id INTO default_saving_type_id FROM public.saving_types WHERE name = 'libre';
  
  -- Vérifier si l'utilisateur a déjà une épargne
  SELECT * INTO user_saving_record
  FROM public.user_savings
  WHERE user_id = NEW.user_id
  ORDER BY 
    CASE WHEN saving_type_id = default_saving_type_id THEN 0 ELSE 1 END,
    balance DESC
  LIMIT 1;
  
  -- Si l'utilisateur n'a pas encore d'épargne, en créer une du type par défaut
  IF user_saving_record IS NULL THEN
    INSERT INTO public.user_savings (
      user_id,
      saving_type_id,
      balance,
      total_saved,
      last_interest_date
    ) VALUES (
      NEW.user_id,
      default_saving_type_id,
      NEW.net_saving,
      NEW.net_saving,
      CURRENT_DATE
    );
  ELSE
    -- Mettre à jour l'épargne existante
    UPDATE public.user_savings
    SET 
      balance = balance + NEW.net_saving,
      total_saved = total_saved + NEW.net_saving,
      updated_at = now()
    WHERE id = user_saving_record.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_apply_savings
AFTER INSERT ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.apply_transaction_savings();

-- Fonction pour calculer les intérêts mensuels (à exécuter via un cron job)
CREATE OR REPLACE FUNCTION calculate_monthly_interest()
RETURNS INTEGER AS $$
DECLARE
  savings_record RECORD;
  interest_amount NUMERIC(12,2);
  counter INTEGER := 0;
BEGIN
  FOR savings_record IN 
    SELECT us.id, us.user_id, us.balance, st.interest_rate, us.last_interest_date
    FROM public.user_savings us
    JOIN public.saving_types st ON us.saving_type_id = st.id
    WHERE 
      us.balance > 0 AND
      st.interest_rate > 0 AND
      (us.last_interest_date < date_trunc('month', CURRENT_DATE) OR
       us.last_interest_date IS NULL)
  LOOP
    -- Calculer l'intérêt mensuel
    interest_amount := round(savings_record.balance * (savings_record.interest_rate / 12), 2);
    
    IF interest_amount > 0 THEN
      -- Mettre à jour le solde
      UPDATE public.user_savings
      SET 
        balance = balance + interest_amount,
        last_interest_date = date_trunc('month', CURRENT_DATE)
      WHERE id = savings_record.id;
      
      -- Enregistrer la transaction d'intérêt
      INSERT INTO public.transactions (
        user_id,
        transaction_type,
        amount_paid,
        data_cost,
        saving_amount,
        management_fee_rate,
        reference_id,
        status,
        metadata
      ) VALUES (
        savings_record.user_id,
        'interest',
        interest_amount,
        0,
        interest_amount,
        0,
        'INTEREST-' || to_char(CURRENT_DATE, 'YYYY-MM'),
        'completed',
        jsonb_build_object(
          'description', 'Intérêts mensuels',
          'calculated_on', CURRENT_DATE,
          'interest_rate', savings_record.interest_rate
        )
      );
      
      counter := counter + 1;
    END IF;
  END LOOP;
  
  RETURN counter;
END;
$$ LANGUAGE plpgsql;

-- Déclencheur pour créer un profil utilisateur automatiquement lors de l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  
  -- Assigner automatiquement le rôle utilisateur
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT NEW.id, id FROM public.roles WHERE name = 'user';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Déclencheur pour mettre à jour le profil quand l'utilisateur change
CREATE OR REPLACE FUNCTION public.handle_user_update() 
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    email = NEW.email,
    updated_at = now()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

----------------------------------------------------------------------
-- 11. TABLE DE PRÉINSCRIPTION
----------------------------------------------------------------------

-- Table pour les préinscriptions avant le lancement officiel
CREATE TABLE public.preregistrations (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  full_name TEXT NOT NULL CHECK (length(full_name) >= 2),
  phone TEXT CHECK (phone IS NULL OR length(phone) >= 8),
  interested_features TEXT[] DEFAULT '{}',
  referral_source TEXT CHECK (referral_source IN ('social_media', 'friend', 'web_search', 'advertisement', 'other')),
  marketing_consent BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'registered', 'unsubscribed')),
  priority_score INTEGER DEFAULT 0 CHECK (priority_score >= 0),
  notes TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_preregistrations_updated_at
BEFORE UPDATE ON public.preregistrations
FOR EACH ROW EXECUTE FUNCTION update_modified_column();

-- Indexation pour les préinscriptions
CREATE INDEX idx_preregistrations_email ON public.preregistrations(email);
CREATE INDEX idx_preregistrations_status ON public.preregistrations(status);
CREATE INDEX idx_preregistrations_created_at ON public.preregistrations(created_at);
CREATE INDEX idx_preregistrations_priority ON public.preregistrations(priority_score DESC);

-- Fonction pour calculer le score de priorité automatiquement
CREATE OR REPLACE FUNCTION calculate_preregistration_priority()
RETURNS TRIGGER AS $$
BEGIN
  -- Score de base
  NEW.priority_score := 10;
  
  -- Bonus pour le consentement marketing
  IF NEW.marketing_consent THEN
    NEW.priority_score := NEW.priority_score + 20;
  END IF;
  
  -- Bonus pour le téléphone fourni
  IF NEW.phone IS NOT NULL AND length(NEW.phone) >= 8 THEN
    NEW.priority_score := NEW.priority_score + 15;
  END IF;
  
  -- Bonus pour les fonctionnalités d'intérêt
  IF array_length(NEW.interested_features, 1) > 0 THEN
    NEW.priority_score := NEW.priority_score + (array_length(NEW.interested_features, 1) * 5);
  END IF;
  
  -- Bonus pour le parrainage
  IF NEW.referral_source = 'friend' THEN
    NEW.priority_score := NEW.priority_score + 25;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_preregistration_priority
BEFORE INSERT OR UPDATE ON public.preregistrations
FOR EACH ROW EXECUTE FUNCTION calculate_preregistration_priority();

-- Vue pour les statistiques de préinscription
CREATE VIEW preregistration_stats AS
SELECT
  count(*) as total_preregistrations,
  count(*) FILTER (WHERE status = 'pending') as pending_count,
  count(*) FILTER (WHERE marketing_consent = true) as marketing_consent_count,
  count(*) FILTER (WHERE phone IS NOT NULL) as with_phone_count,
  avg(priority_score) as average_priority_score,
  count(*) FILTER (WHERE referral_source = 'friend') as friend_referrals,
  count(*) FILTER (WHERE referral_source = 'social_media') as social_media_referrals,
  count(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as last_week_registrations,
  count(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as last_month_registrations
FROM preregistrations;

----------------------------------------------------------------------
-- 12. POLITIQUES DE SÉCURITÉ (RLS)
----------------------------------------------------------------------

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telecom_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saving_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saving_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.preregistrations ENABLE ROW LEVEL SECURITY;

-- Politiques pour profils
CREATE POLICY profiles_select_self ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY profiles_insert_self ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY profiles_admin ON public.profiles
  FOR ALL USING (is_user_admin(auth.uid()));
CREATE POLICY profiles_support_select ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'support'));

-- Politiques pour rôles (admin uniquement)
CREATE POLICY roles_admin ON public.roles
  FOR ALL USING (is_user_admin(auth.uid()));
CREATE POLICY roles_select_all ON public.roles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Politiques pour user_roles
CREATE POLICY user_roles_admin ON public.user_roles
  FOR ALL USING (is_user_admin(auth.uid()));
CREATE POLICY user_roles_select_self ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Politiques pour opérateurs télécom
CREATE POLICY telecom_operators_select_all ON public.telecom_operators
  FOR SELECT USING (true);
CREATE POLICY telecom_operators_admin ON public.telecom_operators
  FOR ALL USING (is_user_admin(auth.uid()));

-- Politiques pour forfaits data
CREATE POLICY data_plans_select_all ON public.data_plans
  FOR SELECT USING (true);
CREATE POLICY data_plans_admin ON public.data_plans
  FOR ALL USING (is_user_admin(auth.uid()));

-- Politiques pour types d'épargne
CREATE POLICY saving_types_select_all ON public.saving_types
  FOR SELECT USING (true);
CREATE POLICY saving_types_admin ON public.saving_types
  FOR ALL USING (is_user_admin(auth.uid()));

-- Politiques pour paramètres d'épargne
CREATE POLICY saving_parameters_select_all ON public.saving_parameters
  FOR SELECT USING (true);
CREATE POLICY saving_parameters_admin ON public.saving_parameters
  FOR ALL USING (is_user_admin(auth.uid()));

-- Politiques pour épargnes utilisateurs
CREATE POLICY user_savings_select_self ON public.user_savings
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY user_savings_admin ON public.user_savings
  FOR ALL USING (is_user_admin(auth.uid()));
CREATE POLICY user_savings_support_select ON public.user_savings
  FOR SELECT USING (has_role(auth.uid(), 'support'));

-- Politiques pour abonnements
CREATE POLICY subscriptions_select_self ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY subscriptions_insert_self ON public.subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY subscriptions_admin ON public.subscriptions
  FOR ALL USING (is_user_admin(auth.uid()));
CREATE POLICY subscriptions_support_select ON public.subscriptions
  FOR SELECT USING (has_role(auth.uid(), 'support'));

-- Politiques pour historique des abonnements
CREATE POLICY subscriptions_history_select_self ON public.subscriptions_history
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY subscriptions_history_admin ON public.subscriptions_history
  FOR ALL USING (is_user_admin(auth.uid()));
CREATE POLICY subscriptions_history_support ON public.subscriptions_history
  FOR SELECT USING (has_role(auth.uid(), 'support'));

-- Politiques pour transactions
CREATE POLICY transactions_select_self ON public.transactions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY transactions_insert_self ON public.transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY transactions_admin ON public.transactions
  FOR ALL USING (is_user_admin(auth.uid()));
CREATE POLICY transactions_support_select ON public.transactions
  FOR SELECT USING (has_role(auth.uid(), 'support'));

-- Politiques pour préinscriptions
CREATE POLICY preregistrations_insert_public ON public.preregistrations
  FOR INSERT WITH CHECK (true); -- Permettre à tous d'insérer
CREATE POLICY preregistrations_admin ON public.preregistrations
  FOR ALL USING (is_user_admin(auth.uid()));
CREATE POLICY preregistrations_support_select ON public.preregistrations
  FOR SELECT USING (has_role(auth.uid(), 'support'));

----------------------------------------------------------------------
-- 12. VUES POUR SIMPLIFIER L'ACCÈS AUX DONNÉES
----------------------------------------------------------------------

-- Vue pour les utilisateurs avec leurs rôles
CREATE VIEW user_profiles_with_roles AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.created_at,
  array_agg(r.name) as roles
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
GROUP BY p.id, p.email, p.full_name, p.phone, p.created_at;

-- Vue pour les statistiques d'épargne
CREATE VIEW saving_statistics AS
SELECT
  st.name as saving_type,
  count(us.id) as total_users,
  sum(us.balance) as total_balance,
  avg(us.balance) as average_balance,
  min(us.balance) as min_balance,
  max(us.balance) as max_balance
FROM user_savings us
JOIN saving_types st ON us.saving_type_id = st.id
GROUP BY st.name;

-- Vue pour les forfaits populaires
CREATE VIEW popular_data_plans AS
SELECT 
  dp.*,
  op.name as operator_name,
  COUNT(s.id) as subscription_count
FROM data_plans dp
JOIN telecom_operators op ON dp.operator_id = op.id
LEFT JOIN subscriptions s ON dp.id = s.plan_id AND s.status = 'active'
WHERE dp.active = true
GROUP BY dp.id, op.name
ORDER BY subscription_count DESC, dp.price ASC;

-- Vue optimisée pour les statistiques du dashboard
CREATE VIEW dashboard_stats AS
SELECT
  -- Nombre total d'utilisateurs
  (SELECT COUNT(*) FROM profiles) as users_count,
  
  -- Montant total d'épargne
  (SELECT COALESCE(SUM(balance), 0) FROM user_savings) as total_savings,
  
  -- Nombre total de transactions
  (SELECT COUNT(*) FROM transactions) as transactions_count,
  
  -- Moyenne d'épargne par transaction
  (SELECT COALESCE(AVG(net_saving), 0) FROM transactions) as average_saving,
  
  -- Nombre d'opérateurs
  (SELECT COUNT(*) FROM telecom_operators WHERE active = true) as operators_count,
  
  -- Nombre de forfaits
  (SELECT COUNT(*) FROM data_plans WHERE active = true) as plans_count,
  
  -- Transactions ce mois-ci
  (SELECT COUNT(*) FROM transactions 
   WHERE created_at >= date_trunc('month', CURRENT_DATE)) as transactions_this_month,
   
  -- Nouvel utilisateurs cette semaine
  (SELECT COUNT(*) FROM profiles 
   WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as new_users_this_week;
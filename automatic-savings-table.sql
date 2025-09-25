-- Table pour suivre les épargnes automatiques
CREATE TABLE IF NOT EXISTS automatic_savings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_id BIGINT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  fee_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  saving_rate NUMERIC(5,4) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les performances
CREATE INDEX IF NOT EXISTS idx_automatic_savings_user_id ON automatic_savings(user_id);
CREATE INDEX IF NOT EXISTS idx_automatic_savings_transaction_id ON automatic_savings(transaction_id);
CREATE INDEX IF NOT EXISTS idx_automatic_savings_status ON automatic_savings(status);

-- RLS (Row Level Security)
ALTER TABLE automatic_savings ENABLE ROW LEVEL SECURITY;

-- Politique pour que les utilisateurs ne voient que leurs propres épargnes automatiques
CREATE POLICY "Users can view their own automatic savings" ON automatic_savings
  FOR SELECT USING (auth.uid() = user_id);

-- Politique pour que les utilisateurs puissent créer leurs propres épargnes automatiques
CREATE POLICY "Users can create their own automatic savings" ON automatic_savings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Politique pour que les utilisateurs puissent mettre à jour leurs propres épargnes automatiques
CREATE POLICY "Users can update their own automatic savings" ON automatic_savings
  FOR UPDATE USING (auth.uid() = user_id);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_automatic_savings_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at
CREATE TRIGGER update_automatic_savings_modified_column
  BEFORE UPDATE ON automatic_savings
  FOR EACH ROW
  EXECUTE FUNCTION update_automatic_savings_modified_column();

-- Commentaires
COMMENT ON TABLE automatic_savings IS 'Table pour suivre les epargnes automatiques generees lors des achats de forfaits';
COMMENT ON COLUMN automatic_savings.user_id IS 'ID de l utilisateur';
COMMENT ON COLUMN automatic_savings.transaction_id IS 'ID de la transaction qui a genere l epargne';
COMMENT ON COLUMN automatic_savings.amount IS 'Montant epargne (apres frais)';
COMMENT ON COLUMN automatic_savings.fee_amount IS 'Montant des frais de gestion';
COMMENT ON COLUMN automatic_savings.saving_rate IS 'Taux d epargne applique';
COMMENT ON COLUMN automatic_savings.status IS 'Statut de l epargne automatique';

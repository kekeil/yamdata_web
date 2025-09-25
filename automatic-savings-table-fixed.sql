-- Table pour suivre les epargnes automatiques
-- Script corrige pour eviter les erreurs de syntaxe

-- Verifier si la table existe deja
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'automatic_savings') THEN
        -- Creer la table automatic_savings
        CREATE TABLE automatic_savings (
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
        CREATE INDEX idx_automatic_savings_user_id ON automatic_savings(user_id);
        CREATE INDEX idx_automatic_savings_transaction_id ON automatic_savings(transaction_id);
        CREATE INDEX idx_automatic_savings_status ON automatic_savings(status);

        -- RLS (Row Level Security)
        ALTER TABLE automatic_savings ENABLE ROW LEVEL SECURITY;

        -- Politiques RLS
        CREATE POLICY "Users can view their own automatic savings" ON automatic_savings
            FOR SELECT USING (auth.uid() = user_id);

        CREATE POLICY "Users can create their own automatic savings" ON automatic_savings
            FOR INSERT WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own automatic savings" ON automatic_savings
            FOR UPDATE USING (auth.uid() = user_id);

        -- Trigger pour updated_at
        CREATE TRIGGER update_automatic_savings_modified_column
            BEFORE UPDATE ON automatic_savings
            FOR EACH ROW
            EXECUTE FUNCTION update_modified_column();

        RAISE NOTICE 'Table automatic_savings creee avec succes';
    ELSE
        RAISE NOTICE 'Table automatic_savings existe deja';
    END IF;
END $$;

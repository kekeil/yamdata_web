-- Script pour verifier et creer les parametres d'epargne si necessaire

-- Verifier si la table saving_parameters existe et a des donnees
DO $$
DECLARE
    param_count INTEGER;
BEGIN
    -- Compter les parametres d'epargne existants
    SELECT COUNT(*) INTO param_count FROM saving_parameters;
    
    IF param_count = 0 THEN
        -- Creer des parametres d'epargne par defaut
        INSERT INTO saving_parameters (saving_type_id, saving_rate, management_fee, effective_from)
        SELECT 
            id,
            CASE 
                WHEN name = 'bloquee' THEN 0.15
                WHEN name = 'semi-bloquee' THEN 0.10
                ELSE 0.05
            END as saving_rate,
            0.01 as management_fee,
            CURRENT_DATE as effective_from
        FROM saving_types
        WHERE active = true;
        
        RAISE NOTICE 'Parametres d''epargne crees avec succes';
    ELSE
        RAISE NOTICE 'Parametres d''epargne existent deja (% parametres)', param_count;
    END IF;
END $$;

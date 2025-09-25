-- Script pour verifier et creer les types d'epargne si necessaire

-- 1. Verifier les types d'epargne existants
SELECT 
    'Types d''epargne existants:' as info,
    name,
    interest_rate,
    lock_period_months,
    active
FROM saving_types
ORDER BY name;

-- 2. Verifier les parametres d'epargne
SELECT 
    'Parametres d''epargne existants:' as info,
    sp.saving_rate,
    sp.management_fee,
    sp.effective_from,
    st.name as type_epargne
FROM saving_parameters sp
JOIN saving_types st ON sp.saving_type_id = st.id
ORDER BY st.name;

-- 3. Si aucun type d'epargne n'existe, les creer
DO $$
DECLARE
    type_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO type_count FROM saving_types;
    
    IF type_count = 0 THEN
        -- Creer les types d'epargne de base
        INSERT INTO saving_types (name, description, lock_period_months, withdrawal_frequency, interest_rate, min_balance) VALUES
        ('bloquee', 'Epargne bloquee pour une periode fixe avec rendement eleve', 12, 'Apres periode de blocage', 0.05, 1000),
        ('semi-bloquee', 'Epargne avec retrait limite et rendement moyen', 6, 'Trimestrielle', 0.03, 500),
        ('libre', 'Epargne avec retrait libre et rendement faible', 0, 'A tout moment', 0.01, 100);
        
        RAISE NOTICE 'Types d''epargne crees avec succes';
    ELSE
        RAISE NOTICE 'Types d''epargne existent deja (% types)', type_count;
    END IF;
END $$;

-- 4. Verifier les parametres d'epargne et les creer si necessaire
DO $$
DECLARE
    param_count INTEGER;
BEGIN
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

-- 5. Afficher le resultat final
SELECT 
    'Configuration finale:' as status,
    (SELECT COUNT(*) FROM saving_types) as types_count,
    (SELECT COUNT(*) FROM saving_parameters) as params_count;

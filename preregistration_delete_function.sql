-- ============================================
-- FUNCTION: delete_preregistration
-- Description: Supprime une préinscription
-- Accessibilité: Admins uniquement
-- ============================================
CREATE OR REPLACE FUNCTION public.delete_preregistration(
  preregistration_id BIGINT
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  -- Vérifier que l'utilisateur est admin
  IF NOT is_user_admin(auth.uid()) THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier que la préinscription existe
  IF NOT EXISTS (SELECT 1 FROM preregistrations WHERE id = preregistration_id) THEN
    RETURN FALSE;
  END IF;
  
  -- Supprimer la préinscription
  DELETE FROM preregistrations
  WHERE id = preregistration_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$function$
;

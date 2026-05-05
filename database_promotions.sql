-- Promotions : table, vue active_promotions, RLS admin (à exécuter sur Supabase si besoin)
-- Colonnes alignées avec app/admin/dashboard/promotions/page.tsx

CREATE TABLE IF NOT EXISTS public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) <= 80),
  description text CHECK (description IS NULL OR char_length(description) <= 300),
  emoji text NOT NULL DEFAULT '🎁',
  accent_color text NOT NULL DEFAULT '#16a34a',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  operator_id integer REFERENCES public.telecom_operators(id) ON DELETE SET NULL,
  recurrence_days integer[],
  time_start time without time zone,
  time_end time without time zone,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS promotions_created_at_desc_idx ON public.promotions (created_at DESC);

CREATE OR REPLACE VIEW public.active_promotions AS
SELECT
  p.id,
  p.title,
  p.description,
  p.accent_color,
  p.emoji,
  op.name AS operator_name
FROM public.promotions p
LEFT JOIN public.telecom_operators op ON op.id = p.operator_id
WHERE p.active = true
  AND p.starts_at <= now()
  AND (p.ends_at IS NULL OR p.ends_at >= now())
  AND (
    p.recurrence_days IS NULL
    OR coalesce(cardinality(p.recurrence_days), 0) = 0
    OR cardinality(p.recurrence_days) = 7
    OR (extract(isodow from now())::integer = any (p.recurrence_days))
  )
  AND (
    p.time_start IS NULL
    OR p.time_end IS NULL
    OR (current_time >= p.time_start AND current_time <= p.time_end)
  );

-- Lecture côté utilisateur connecté (la vue interroge promotions sous RLS)
DROP POLICY IF EXISTS promotions_select_authenticated_visible ON public.promotions;

CREATE POLICY promotions_select_authenticated_visible ON public.promotions
  FOR SELECT TO authenticated
  USING (
    active = true
    AND starts_at <= now()
    AND (ends_at IS NULL OR ends_at >= now())
    AND (
      recurrence_days IS NULL
      OR coalesce(cardinality(recurrence_days), 0) = 0
      OR cardinality(recurrence_days) = 7
      OR (extract(isodow from now())::integer = any (recurrence_days))
    )
    AND (
      time_start IS NULL
      OR time_end IS NULL
      OR (current_time >= time_start AND current_time <= time_end)
    )
  );

ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS promotions_admin_select ON public.promotions;
DROP POLICY IF EXISTS promotions_admin_insert ON public.promotions;
DROP POLICY IF EXISTS promotions_admin_update ON public.promotions;
DROP POLICY IF EXISTS promotions_admin_delete ON public.promotions;

CREATE POLICY promotions_admin_select ON public.promotions
  FOR SELECT TO authenticated
  USING (is_user_admin((SELECT auth.uid() AS uid)));

CREATE POLICY promotions_admin_insert ON public.promotions
  FOR INSERT TO authenticated
  WITH CHECK (is_user_admin((SELECT auth.uid() AS uid)));

CREATE POLICY promotions_admin_update ON public.promotions
  FOR UPDATE TO authenticated
  USING (is_user_admin((SELECT auth.uid() AS uid)))
  WITH CHECK (is_user_admin((SELECT auth.uid() AS uid)));

CREATE POLICY promotions_admin_delete ON public.promotions
  FOR DELETE TO authenticated
  USING (is_user_admin((SELECT auth.uid() AS uid)));

GRANT SELECT ON public.active_promotions TO authenticated;

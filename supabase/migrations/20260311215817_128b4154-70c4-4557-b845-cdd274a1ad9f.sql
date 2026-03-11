-- Weekly financial snapshots saved when resetting the week
CREATE TABLE IF NOT EXISTS public.weekly_closings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  income NUMERIC NOT NULL DEFAULT 0,
  expense NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.weekly_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage weekly_closings in their company"
ON public.weekly_closings
FOR ALL
TO authenticated
USING (
  company_id IN (
    SELECT profiles.company_id
    FROM public.profiles
    WHERE profiles.id = auth.uid()
  )
)
WITH CHECK (
  company_id IN (
    SELECT profiles.company_id
    FROM public.profiles
    WHERE profiles.id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_weekly_closings_company_period
ON public.weekly_closings (company_id, week_start DESC, created_at DESC);

CREATE TABLE public.motoboy_payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  motoboy_id uuid NOT NULL,
  motoboy_name text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  paid_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.motoboy_payment_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View payment history in company"
ON public.motoboy_payment_history FOR SELECT
USING (has_company_access(company_id));

CREATE POLICY "Insert payment history in company"
ON public.motoboy_payment_history FOR INSERT
WITH CHECK (has_company_access(company_id));

CREATE POLICY "Delete payment history in company"
ON public.motoboy_payment_history FOR DELETE
USING (has_company_access(company_id));

CREATE INDEX idx_motoboy_payment_history_company_paid_at
ON public.motoboy_payment_history (company_id, paid_at DESC);

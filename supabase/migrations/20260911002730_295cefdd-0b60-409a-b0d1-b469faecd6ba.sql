ALTER TABLE public.bills
  ADD COLUMN IF NOT EXISTS skipped_months text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS end_month text;

CREATE TABLE IF NOT EXISTS public.bill_partial_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id),
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  paid_month text NOT NULL,
  amount numeric NOT NULL,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bill_partial_payments TO authenticated;
GRANT ALL ON public.bill_partial_payments TO service_role;

ALTER TABLE public.bill_partial_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view partial payments"
ON public.bill_partial_payments FOR SELECT TO authenticated
USING (public.has_company_access(company_id));

CREATE POLICY "Company members can create partial payments"
ON public.bill_partial_payments FOR INSERT TO authenticated
WITH CHECK (public.has_company_access(company_id));

CREATE POLICY "Company members can update partial payments"
ON public.bill_partial_payments FOR UPDATE TO authenticated
USING (public.has_company_access(company_id));

CREATE POLICY "Company members can delete partial payments"
ON public.bill_partial_payments FOR DELETE TO authenticated
USING (public.has_company_access(company_id));

CREATE INDEX IF NOT EXISTS idx_bill_partial_payments_bill_month
  ON public.bill_partial_payments (bill_id, paid_month);
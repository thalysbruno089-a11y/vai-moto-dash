
-- Add payment_type to loan_payments
ALTER TABLE public.loan_payments ADD COLUMN payment_type text NOT NULL DEFAULT 'interest';

-- Create monthly_closings table for historical dashboard data
CREATE TABLE public.monthly_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  income numeric NOT NULL DEFAULT 0,
  expense numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(company_id, month, year)
);

ALTER TABLE public.monthly_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage monthly_closings in their company"
ON public.monthly_closings
FOR ALL
TO authenticated
USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

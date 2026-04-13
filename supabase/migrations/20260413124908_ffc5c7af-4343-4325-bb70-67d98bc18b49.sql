
CREATE TABLE public.balance_differences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
  bill_name TEXT NOT NULL,
  bill_value NUMERIC NOT NULL,
  available_balance NUMERIC NOT NULL DEFAULT 0,
  difference_amount NUMERIC NOT NULL,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.balance_differences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view balance_differences in their company"
ON public.balance_differences FOR SELECT
USING (has_company_access(company_id));

CREATE POLICY "Users can insert balance_differences in their company"
ON public.balance_differences FOR INSERT
WITH CHECK (has_company_access(company_id));

CREATE POLICY "Users can delete balance_differences in their company"
ON public.balance_differences FOR DELETE
USING (has_company_access(company_id));

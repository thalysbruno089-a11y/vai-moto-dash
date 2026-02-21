
CREATE TABLE public.motorcycle_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  category TEXT NOT NULL CHECK (category IN ('pneu', 'relacao', 'oleo', 'outros')),
  value NUMERIC NOT NULL,
  mileage NUMERIC NULL,
  description TEXT NULL,
  service_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.motorcycle_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view motorcycle_expenses in their company"
ON public.motorcycle_expenses FOR SELECT
USING (has_company_access(company_id));

CREATE POLICY "Users can insert motorcycle_expenses in their company"
ON public.motorcycle_expenses FOR INSERT
WITH CHECK (has_company_access(company_id));

CREATE POLICY "Users can update motorcycle_expenses in their company"
ON public.motorcycle_expenses FOR UPDATE
USING (has_company_access(company_id));

CREATE POLICY "Users can delete motorcycle_expenses in their company"
ON public.motorcycle_expenses FOR DELETE
USING (has_company_access(company_id));

CREATE TRIGGER update_motorcycle_expenses_updated_at
BEFORE UPDATE ON public.motorcycle_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

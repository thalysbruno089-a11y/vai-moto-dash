
-- Create loans table
CREATE TABLE public.loans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  type TEXT NOT NULL CHECK (type IN ('lent', 'borrowed')),
  person_name TEXT NOT NULL,
  notes TEXT,
  principal_amount NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL CHECK (interest_rate IN (10, 20)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loan_payments table
CREATE TABLE public.loan_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_id UUID NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  amount NUMERIC NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for loans
CREATE POLICY "Users can view loans in their company" ON public.loans FOR SELECT USING (has_company_access(company_id));
CREATE POLICY "Users can insert loans in their company" ON public.loans FOR INSERT WITH CHECK (has_company_access(company_id));
CREATE POLICY "Users can update loans in their company" ON public.loans FOR UPDATE USING (has_company_access(company_id));
CREATE POLICY "Users can delete loans in their company" ON public.loans FOR DELETE USING (has_company_access(company_id));

-- RLS policies for loan_payments
CREATE POLICY "Users can view loan_payments in their company" ON public.loan_payments FOR SELECT USING (has_company_access(company_id));
CREATE POLICY "Users can insert loan_payments in their company" ON public.loan_payments FOR INSERT WITH CHECK (has_company_access(company_id));
CREATE POLICY "Users can update loan_payments in their company" ON public.loan_payments FOR UPDATE USING (has_company_access(company_id));
CREATE POLICY "Users can delete loan_payments in their company" ON public.loan_payments FOR DELETE USING (has_company_access(company_id));

-- Triggers for updated_at
CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON public.loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

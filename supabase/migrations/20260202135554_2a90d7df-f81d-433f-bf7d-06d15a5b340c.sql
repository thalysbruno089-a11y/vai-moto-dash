-- Create bills table for payment reminders
CREATE TABLE public.bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  value NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  paid_at TIMESTAMP WITH TIME ZONE,
  parent_bill_id UUID REFERENCES public.bills(id) ON DELETE SET NULL,
  installment_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view bills in their company" 
ON public.bills 
FOR SELECT 
USING (has_company_access(company_id));

CREATE POLICY "Users can insert bills in their company" 
ON public.bills 
FOR INSERT 
WITH CHECK (has_company_access(company_id));

CREATE POLICY "Users can update bills in their company" 
ON public.bills 
FOR UPDATE 
USING (has_company_access(company_id));

CREATE POLICY "Users can delete bills in their company" 
ON public.bills 
FOR DELETE 
USING (has_company_access(company_id));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bills_updated_at
BEFORE UPDATE ON public.bills
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
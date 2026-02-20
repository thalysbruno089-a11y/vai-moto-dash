
-- Create motorcycle rentals table
CREATE TABLE public.motorcycle_rentals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  plate TEXT NOT NULL,
  color TEXT NOT NULL,
  renter_name TEXT NOT NULL,
  renter_phone TEXT,
  daily_rate NUMERIC NOT NULL,
  pickup_date DATE NOT NULL DEFAULT CURRENT_DATE,
  return_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.motorcycle_rentals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view rentals in their company" ON public.motorcycle_rentals FOR SELECT USING (has_company_access(company_id));
CREATE POLICY "Users can insert rentals in their company" ON public.motorcycle_rentals FOR INSERT WITH CHECK (has_company_access(company_id));
CREATE POLICY "Users can update rentals in their company" ON public.motorcycle_rentals FOR UPDATE USING (has_company_access(company_id));
CREATE POLICY "Users can delete rentals in their company" ON public.motorcycle_rentals FOR DELETE USING (has_company_access(company_id));

-- Trigger for updated_at
CREATE TRIGGER update_motorcycle_rentals_updated_at
  BEFORE UPDATE ON public.motorcycle_rentals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

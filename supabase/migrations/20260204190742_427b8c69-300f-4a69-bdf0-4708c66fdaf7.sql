-- Create rides table to track individual deliveries/rides
CREATE TABLE public.rides (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  motoboy_id UUID NOT NULL REFERENCES public.motoboys(id) ON DELETE CASCADE,
  ride_date DATE NOT NULL DEFAULT CURRENT_DATE,
  value NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view rides in their company" 
ON public.rides 
FOR SELECT 
USING (has_company_access(company_id));

CREATE POLICY "Users can insert rides in their company" 
ON public.rides 
FOR INSERT 
WITH CHECK (has_company_access(company_id));

CREATE POLICY "Users can update rides in their company" 
ON public.rides 
FOR UPDATE 
USING (has_company_access(company_id));

CREATE POLICY "Users can delete rides in their company" 
ON public.rides 
FOR DELETE 
USING (has_company_access(company_id));

-- Trigger for updated_at
CREATE TRIGGER update_rides_updated_at
BEFORE UPDATE ON public.rides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for common queries
CREATE INDEX idx_rides_client_id ON public.rides(client_id);
CREATE INDEX idx_rides_motoboy_id ON public.rides(motoboy_id);
CREATE INDEX idx_rides_ride_date ON public.rides(ride_date);
CREATE INDEX idx_rides_company_id ON public.rides(company_id);
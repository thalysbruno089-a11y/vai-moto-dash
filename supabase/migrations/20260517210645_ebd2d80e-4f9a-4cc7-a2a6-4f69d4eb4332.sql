CREATE TABLE public.bill_vales (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL,
  bill_id uuid NOT NULL,
  amount numeric NOT NULL,
  taken_at date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  cash_flow_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_bill_vales_bill_id ON public.bill_vales(bill_id);
CREATE INDEX idx_bill_vales_company_id ON public.bill_vales(company_id);

ALTER TABLE public.bill_vales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View bill_vales in company" ON public.bill_vales
  FOR SELECT USING (has_company_access(company_id));
CREATE POLICY "Insert bill_vales in company" ON public.bill_vales
  FOR INSERT WITH CHECK (has_company_access(company_id));
CREATE POLICY "Update bill_vales in company" ON public.bill_vales
  FOR UPDATE USING (has_company_access(company_id));
CREATE POLICY "Delete bill_vales in company" ON public.bill_vales
  FOR DELETE USING (has_company_access(company_id));

CREATE TRIGGER trg_log_deletion_bill_vales
  BEFORE DELETE ON public.bill_vales
  FOR EACH ROW EXECUTE FUNCTION public.log_deletion();

CREATE TABLE public.ultra_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
  position INTEGER NOT NULL DEFAULT 1,
  horario TEXT,
  entregador TEXT,
  endereco TEXT,
  pagamento NUMERIC(10,2),
  taxa NUMERIC(10,2),
  ok BOOLEAN NOT NULL DEFAULT false,
  tem_receita BOOLEAN NOT NULL DEFAULT false,
  receita_ok BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ultra_deliveries TO authenticated;
GRANT ALL ON public.ultra_deliveries TO service_role;

ALTER TABLE public.ultra_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company members can view ultra deliveries"
  ON public.ultra_deliveries FOR SELECT
  TO authenticated
  USING (company_id IS NULL OR public.has_company_access(company_id));

CREATE POLICY "Authenticated can insert ultra deliveries"
  ON public.ultra_deliveries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Company members can update ultra deliveries"
  ON public.ultra_deliveries FOR UPDATE
  TO authenticated
  USING (company_id IS NULL OR public.has_company_access(company_id));

CREATE POLICY "Company members can delete ultra deliveries"
  ON public.ultra_deliveries FOR DELETE
  TO authenticated
  USING (company_id IS NULL OR public.has_company_access(company_id));

CREATE TRIGGER update_ultra_deliveries_updated_at
  BEFORE UPDATE ON public.ultra_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ultra_deliveries_date ON public.ultra_deliveries(delivery_date DESC);
CREATE INDEX idx_ultra_deliveries_company ON public.ultra_deliveries(company_id);

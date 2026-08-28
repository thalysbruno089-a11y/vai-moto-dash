CREATE TABLE public.santa_luzia_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id),
  delivery_date date NOT NULL DEFAULT CURRENT_DATE,
  position integer NOT NULL DEFAULT 1,
  horario text,
  numero text,
  entregador text,
  endereco text,
  pagamento numeric,
  taxa numeric,
  ok boolean NOT NULL DEFAULT false,
  tem_comprovante boolean NOT NULL DEFAULT false,
  comprovante_ok boolean NOT NULL DEFAULT false,
  payment_method text,
  sent_to_central boolean NOT NULL DEFAULT false,
  sent_at timestamptz,
  saiu_maquina boolean NOT NULL DEFAULT false,
  devolveu_maquina boolean NOT NULL DEFAULT false,
  dinheiro_devolvido boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.santa_luzia_deliveries TO authenticated;
GRANT ALL ON public.santa_luzia_deliveries TO service_role;

ALTER TABLE public.santa_luzia_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view santa luzia deliveries"
  ON public.santa_luzia_deliveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert santa luzia deliveries"
  ON public.santa_luzia_deliveries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update santa luzia deliveries"
  ON public.santa_luzia_deliveries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated can delete santa luzia deliveries"
  ON public.santa_luzia_deliveries FOR DELETE TO authenticated USING (true);

CREATE TRIGGER update_santa_luzia_deliveries_updated_at
  BEFORE UPDATE ON public.santa_luzia_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_log_del_santa_luzia_deliveries
  BEFORE DELETE ON public.santa_luzia_deliveries
  FOR EACH ROW EXECUTE FUNCTION public.log_deletion();
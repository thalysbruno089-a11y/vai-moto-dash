CREATE TABLE public.bill_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  bill_id UUID NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  paid_month TEXT NOT NULL,
  amount NUMERIC,
  paid_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (bill_id, paid_month)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bill_payments TO authenticated;
GRANT ALL ON public.bill_payments TO service_role;
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Company members can manage bill payments" ON public.bill_payments FOR ALL TO authenticated USING (public.has_company_access(company_id)) WITH CHECK (public.has_company_access(company_id));

-- Backfill: contas fixas atualmente marcadas como pagas (mês do paid_at)
INSERT INTO public.bill_payments (company_id, bill_id, paid_month, amount, paid_at)
SELECT b.company_id, b.id, to_char(b.paid_at AT TIME ZONE 'America/Sao_Paulo', 'YYYY-MM'), b.value, b.paid_at
FROM public.bills b
WHERE b.is_fixed = true AND b.status = 'paid' AND b.paid_at IS NOT NULL
ON CONFLICT (bill_id, paid_month) DO NOTHING;

-- Backfill: pagamentos de meses anteriores recuperados do fluxo de caixa (descrição = nome da conta)
INSERT INTO public.bill_payments (company_id, bill_id, paid_month, amount, paid_at)
SELECT DISTINCT b.company_id, b.id, to_char(cf.flow_date, 'YYYY-MM'), cf.value, cf.created_at
FROM public.cash_flow cf
JOIN public.bills b ON b.company_id = cf.company_id AND b.name = cf.description
WHERE cf.type = 'expense' AND b.is_fixed = true
ON CONFLICT (bill_id, paid_month) DO NOTHING;
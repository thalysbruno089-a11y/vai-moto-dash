
CREATE TABLE public.carlos_bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('deposit','debit')),
  amount NUMERIC NOT NULL,
  description TEXT,
  ride_id UUID,
  client_id UUID,
  client_name TEXT,
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.carlos_bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view bank tx" ON public.carlos_bank_transactions
  FOR SELECT USING (has_company_access(company_id) AND get_user_role() = 'admin'::user_role);
CREATE POLICY "Admins insert bank tx" ON public.carlos_bank_transactions
  FOR INSERT WITH CHECK (has_company_access(company_id) AND get_user_role() = 'admin'::user_role);
CREATE POLICY "Admins update bank tx" ON public.carlos_bank_transactions
  FOR UPDATE USING (has_company_access(company_id) AND get_user_role() = 'admin'::user_role);
CREATE POLICY "Admins delete bank tx" ON public.carlos_bank_transactions
  FOR DELETE USING (has_company_access(company_id) AND get_user_role() = 'admin'::user_role);

-- Permissive insert policy for the trigger (runs as definer below); plus service-side function bypass
CREATE OR REPLACE FUNCTION public.log_ride_paid_to_carlos_bank()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_name TEXT;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.payment_status = 'paid')
     OR (TG_OP = 'UPDATE' AND NEW.payment_status = 'paid' AND COALESCE(OLD.payment_status,'') <> 'paid') THEN
    SELECT name INTO v_client_name FROM public.clients WHERE id = NEW.client_id;
    INSERT INTO public.carlos_bank_transactions
      (company_id, type, amount, description, ride_id, client_id, client_name, transaction_date)
    VALUES
      (NEW.company_id, 'debit', NEW.value, 'Pagamento de corrida', NEW.id, NEW.client_id, v_client_name, now());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ride_paid_carlos_bank
AFTER INSERT OR UPDATE OF payment_status ON public.rides
FOR EACH ROW EXECUTE FUNCTION public.log_ride_paid_to_carlos_bank();

-- Backfill existing paid rides as debits (so Carlos sees historical context)
INSERT INTO public.carlos_bank_transactions (company_id, type, amount, description, ride_id, client_id, client_name, transaction_date)
SELECT r.company_id, 'debit', r.value, 'Pagamento de corrida (hist\u00f3rico)', r.id, r.client_id, c.name, r.updated_at
FROM public.rides r
LEFT JOIN public.clients c ON c.id = r.client_id
WHERE r.payment_status = 'paid';

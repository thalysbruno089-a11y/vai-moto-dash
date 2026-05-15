
-- Deletion logs table
CREATE TABLE public.deletion_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  record_label text,
  record_data jsonb,
  deleted_by uuid,
  deleted_by_name text,
  deleted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_deletion_logs_company ON public.deletion_logs(company_id, deleted_at DESC);

ALTER TABLE public.deletion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view deletion logs"
  ON public.deletion_logs FOR SELECT
  USING (has_company_access(company_id) AND get_user_role() = 'admin'::user_role);

CREATE POLICY "System inserts deletion logs"
  ON public.deletion_logs FOR INSERT
  WITH CHECK (true);

-- Generic trigger function
CREATE OR REPLACE FUNCTION public.log_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_user_name text;
  v_label text;
  v_company uuid;
BEGIN
  -- company_id
  BEGIN
    v_company := (to_jsonb(OLD) ->> 'company_id')::uuid;
  EXCEPTION WHEN others THEN
    v_company := NULL;
  END;

  -- friendly label per table
  v_label := COALESCE(
    to_jsonb(OLD) ->> 'name',
    to_jsonb(OLD) ->> 'description',
    to_jsonb(OLD) ->> 'plate',
    to_jsonb(OLD) ->> 'renter_name',
    to_jsonb(OLD) ->> 'person_name',
    to_jsonb(OLD) ->> 'client_name',
    to_jsonb(OLD) ->> 'motoboy_name'
  );

  IF v_user IS NOT NULL THEN
    SELECT name INTO v_user_name FROM public.profiles WHERE id = v_user;
  END IF;

  INSERT INTO public.deletion_logs(company_id, table_name, record_id, record_label, record_data, deleted_by, deleted_by_name)
  VALUES (v_company, TG_TABLE_NAME, (to_jsonb(OLD) ->> 'id')::uuid, v_label, to_jsonb(OLD), v_user, v_user_name);

  RETURN OLD;
END;
$$;

-- Attach triggers
CREATE TRIGGER trg_log_del_motoboys BEFORE DELETE ON public.motoboys FOR EACH ROW EXECUTE FUNCTION public.log_deletion();
CREATE TRIGGER trg_log_del_clients BEFORE DELETE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.log_deletion();
CREATE TRIGGER trg_log_del_bills BEFORE DELETE ON public.bills FOR EACH ROW EXECUTE FUNCTION public.log_deletion();
CREATE TRIGGER trg_log_del_cash_flow BEFORE DELETE ON public.cash_flow FOR EACH ROW EXECUTE FUNCTION public.log_deletion();
CREATE TRIGGER trg_log_del_rides BEFORE DELETE ON public.rides FOR EACH ROW EXECUTE FUNCTION public.log_deletion();
CREATE TRIGGER trg_log_del_carlos_bank BEFORE DELETE ON public.carlos_bank_transactions FOR EACH ROW EXECUTE FUNCTION public.log_deletion();
CREATE TRIGGER trg_log_del_pix BEFORE DELETE ON public.client_pix_requests FOR EACH ROW EXECUTE FUNCTION public.log_deletion();
CREATE TRIGGER trg_log_del_moto_exp BEFORE DELETE ON public.motorcycle_expenses FOR EACH ROW EXECUTE FUNCTION public.log_deletion();
CREATE TRIGGER trg_log_del_categories BEFORE DELETE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.log_deletion();
CREATE TRIGGER trg_log_del_orders BEFORE DELETE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.log_deletion();
CREATE TRIGGER trg_log_del_payments BEFORE DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.log_deletion();
CREATE TRIGGER trg_log_del_moto_pay_hist BEFORE DELETE ON public.motoboy_payment_history FOR EACH ROW EXECUTE FUNCTION public.log_deletion();

CREATE POLICY "Gabriel can view queue in his company" ON public.queue_entries FOR SELECT TO authenticated USING (auth.uid() = '9ac4e986-ff35-49af-a377-4dd9e281af4a'::uuid AND public.has_company_access(company_id));

CREATE OR REPLACE FUNCTION public.queue_call_next()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_next uuid;
BEGIN
  v_company := public.get_user_company_id();
  IF v_company IS NULL OR NOT (
    public.get_user_role() = 'admin'
    OR lower((SELECT name FROM public.profiles WHERE id = auth.uid())) = 'sofia'
    OR auth.uid() = '9ac4e986-ff35-49af-a377-4dd9e281af4a'::uuid
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext(v_company::text));
  UPDATE public.queue_entries SET status = 'finished', finished_at = now() WHERE company_id = v_company AND status = 'called';
  SELECT id INTO v_next FROM public.queue_entries WHERE company_id = v_company AND status = 'waiting' ORDER BY position, joined_at LIMIT 1 FOR UPDATE;
  IF v_next IS NOT NULL THEN
    UPDATE public.queue_entries SET status = 'called', called_at = now(), finished_at = NULL WHERE id = v_next;
  END IF;
  RETURN v_next;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_call_next() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.queue_call_next() TO authenticated;
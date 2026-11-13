CREATE POLICY "Gabriel can remove entries in his company" ON public.queue_entries FOR DELETE TO authenticated USING (public.has_company_access(company_id) AND auth.uid() = '9ac4e986-ff35-49af-a377-4dd9e281af4a'::uuid);
CREATE OR REPLACE FUNCTION public.queue_return_called(p_entry_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_company uuid;
BEGIN
  v_company := public.get_user_company_id();
  IF v_company IS NULL OR NOT COALESCE(public.is_full_queue_staff() OR auth.uid() = '9ac4e986-ff35-49af-a377-4dd9e281af4a'::uuid, false) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(v_company::text));
  UPDATE public.queue_entries SET status = 'waiting', called_at = NULL, finished_at = NULL WHERE id = p_entry_id AND company_id = v_company AND status = 'called';
END; $function$;
REVOKE ALL ON FUNCTION public.queue_return_called(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.queue_return_called(uuid) TO authenticated;
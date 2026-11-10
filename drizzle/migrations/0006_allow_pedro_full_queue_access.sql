CREATE OR REPLACE FUNCTION public.is_full_queue_staff()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.get_user_role() = 'admin'
    OR lower((SELECT name FROM public.profiles WHERE id = auth.uid())) = 'sofia'
    OR auth.uid() = '10902345-eb9b-4f1c-965b-0c121503fa08'::uuid
$$;
REVOKE ALL ON FUNCTION public.is_full_queue_staff() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_full_queue_staff() TO authenticated;

DO $$
DECLARE t text; op text;
BEGIN
  FOREACH t IN ARRAY ARRAY['queue_entries','saved_reports','saved_report_items'] LOOP
    FOREACH op IN ARRAY ARRAY['view','create','update','delete'] LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Queue staff can '||op||' '||CASE t WHEN 'queue_entries' THEN 'entries' WHEN 'saved_reports' THEN 'reports' ELSE 'report items' END, t);
    END LOOP;
    EXECUTE format('CREATE POLICY "Queue staff can view %s" ON public.%I FOR SELECT TO authenticated USING (public.has_company_access(company_id) AND public.is_full_queue_staff())', CASE t WHEN 'queue_entries' THEN 'entries' WHEN 'saved_reports' THEN 'reports' ELSE 'report items' END, t);
    EXECUTE format('CREATE POLICY "Queue staff can create %s" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.has_company_access(company_id) AND public.is_full_queue_staff())', CASE t WHEN 'queue_entries' THEN 'entries' WHEN 'saved_reports' THEN 'reports' ELSE 'report items' END, t);
    EXECUTE format('CREATE POLICY "Queue staff can update %s" ON public.%I FOR UPDATE TO authenticated USING (public.has_company_access(company_id) AND public.is_full_queue_staff()) WITH CHECK (public.has_company_access(company_id) AND public.is_full_queue_staff())', CASE t WHEN 'queue_entries' THEN 'entries' WHEN 'saved_reports' THEN 'reports' ELSE 'report items' END, t);
    EXECUTE format('CREATE POLICY "Queue staff can delete %s" ON public.%I FOR DELETE TO authenticated USING (public.has_company_access(company_id) AND public.is_full_queue_staff())', CASE t WHEN 'queue_entries' THEN 'entries' WHEN 'saved_reports' THEN 'reports' ELSE 'report items' END, t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.queue_call_next()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $function$
DECLARE v_company uuid; v_next uuid;
BEGIN
  v_company := public.get_user_company_id();
  IF v_company IS NULL OR NOT (public.is_full_queue_staff() OR auth.uid() = '9ac4e986-ff35-49af-a377-4dd9e281af4a'::uuid) THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(v_company::text));
  UPDATE public.queue_entries SET status = 'finished', finished_at = now() WHERE company_id = v_company AND status = 'called';
  SELECT id INTO v_next FROM public.queue_entries WHERE company_id = v_company AND status = 'waiting' ORDER BY position, joined_at LIMIT 1 FOR UPDATE;
  IF v_next IS NOT NULL THEN UPDATE public.queue_entries SET status = 'called', called_at = now(), finished_at = NULL WHERE id = v_next; END IF;
  RETURN v_next;
END; $function$;

CREATE OR REPLACE FUNCTION public.queue_finish_current()
RETURNS uuid LANGUAGE plpgsql SET search_path TO 'public' AS $function$
DECLARE v_company uuid; v_current uuid;
BEGIN
  v_company := public.get_user_company_id();
  IF v_company IS NULL OR NOT public.is_full_queue_staff() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT id INTO v_current FROM public.queue_entries WHERE company_id = v_company AND status = 'called' LIMIT 1 FOR UPDATE;
  IF v_current IS NOT NULL THEN UPDATE public.queue_entries SET status = 'finished', finished_at = now() WHERE id = v_current; END IF;
  RETURN v_current;
END; $function$;

CREATE OR REPLACE FUNCTION public.queue_return_called(p_entry_id uuid)
RETURNS void LANGUAGE plpgsql SET search_path TO 'public' AS $function$
DECLARE v_company uuid;
BEGIN
  v_company := public.get_user_company_id();
  IF v_company IS NULL OR NOT public.is_full_queue_staff() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  UPDATE public.queue_entries SET status = 'waiting', called_at = NULL, finished_at = NULL WHERE id = p_entry_id AND company_id = v_company AND status = 'called';
END; $function$;

CREATE OR REPLACE FUNCTION public.queue_save_and_reset()
RETURNS uuid LANGUAGE plpgsql SET search_path TO 'public' AS $function$
DECLARE v_company uuid; v_report uuid; v_total integer;
BEGIN
  v_company := public.get_user_company_id();
  IF v_company IS NULL OR NOT public.is_full_queue_staff() THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(v_company::text));
  SELECT count(*)::integer INTO v_total FROM public.queue_entries WHERE company_id = v_company AND status = 'finished' AND finished_at::date = CURRENT_DATE;
  IF v_total = 0 THEN RAISE EXCEPTION 'Nenhuma corrida finalizada para salvar'; END IF;
  INSERT INTO public.saved_reports (company_id, report_date, total, saved_by) VALUES (v_company, CURRENT_DATE, v_total, auth.uid()) RETURNING id INTO v_report;
  INSERT INTO public.saved_report_items (report_id, company_id, motoboy_id, motoboy_code, motoboy_name, count)
  SELECT v_report, v_company, q.motoboy_id, COALESCE(m.number, '—'), m.name, count(*)::integer
  FROM public.queue_entries q JOIN public.motoboys m ON m.id = q.motoboy_id
  WHERE q.company_id = v_company AND q.status = 'finished' AND q.finished_at::date = CURRENT_DATE
  GROUP BY q.motoboy_id, m.number, m.name;
  DELETE FROM public.queue_entries WHERE company_id = v_company AND status = 'finished' AND finished_at::date = CURRENT_DATE;
  RETURN v_report;
END; $function$;
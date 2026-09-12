CREATE TABLE public.queue_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  motoboy_id uuid NOT NULL REFERENCES public.motoboys(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'finished')),
  position bigint NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  called_at timestamptz,
  finished_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.queue_entries TO authenticated;
GRANT ALL ON public.queue_entries TO service_role;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Queue staff can view entries" ON public.queue_entries FOR SELECT TO authenticated USING (public.has_company_access(company_id) AND (public.get_user_role() = 'admin' OR lower((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid())) = 'sofia'));
CREATE POLICY "Queue staff can create entries" ON public.queue_entries FOR INSERT TO authenticated WITH CHECK (public.has_company_access(company_id) AND (public.get_user_role() = 'admin' OR lower((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid())) = 'sofia'));
CREATE POLICY "Queue staff can update entries" ON public.queue_entries FOR UPDATE TO authenticated USING (public.has_company_access(company_id) AND (public.get_user_role() = 'admin' OR lower((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid())) = 'sofia')) WITH CHECK (public.has_company_access(company_id) AND (public.get_user_role() = 'admin' OR lower((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid())) = 'sofia'));
CREATE POLICY "Queue staff can delete entries" ON public.queue_entries FOR DELETE TO authenticated USING (public.has_company_access(company_id) AND (public.get_user_role() = 'admin' OR lower((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid())) = 'sofia'));
CREATE UNIQUE INDEX queue_one_open_entry_per_motoboy ON public.queue_entries (company_id, motoboy_id) WHERE status IN ('waiting', 'called');
CREATE UNIQUE INDEX queue_one_called_per_company ON public.queue_entries (company_id) WHERE status = 'called';
CREATE INDEX queue_entries_company_status_position ON public.queue_entries (company_id, status, position);
CREATE TRIGGER update_queue_entries_updated_at BEFORE UPDATE ON public.queue_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.saved_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  total integer NOT NULL DEFAULT 0 CHECK (total >= 0),
  saved_at timestamptz NOT NULL DEFAULT now(),
  saved_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_reports TO authenticated;
GRANT ALL ON public.saved_reports TO service_role;
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Queue staff can view reports" ON public.saved_reports FOR SELECT TO authenticated USING (public.has_company_access(company_id) AND (public.get_user_role() = 'admin' OR lower((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid())) = 'sofia'));
CREATE POLICY "Queue staff can create reports" ON public.saved_reports FOR INSERT TO authenticated WITH CHECK (public.has_company_access(company_id) AND (public.get_user_role() = 'admin' OR lower((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid())) = 'sofia'));
CREATE POLICY "Queue staff can update reports" ON public.saved_reports FOR UPDATE TO authenticated USING (public.has_company_access(company_id) AND (public.get_user_role() = 'admin' OR lower((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid())) = 'sofia')) WITH CHECK (public.has_company_access(company_id) AND (public.get_user_role() = 'admin' OR lower((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid())) = 'sofia'));
CREATE POLICY "Queue staff can delete reports" ON public.saved_reports FOR DELETE TO authenticated USING (public.has_company_access(company_id) AND (public.get_user_role() = 'admin' OR lower((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid())) = 'sofia'));
CREATE INDEX saved_reports_company_date ON public.saved_reports (company_id, report_date DESC, saved_at DESC);

CREATE TABLE public.saved_report_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.saved_reports(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  motoboy_id uuid NOT NULL REFERENCES public.motoboys(id) ON DELETE RESTRICT,
  motoboy_code text NOT NULL,
  motoboy_name text NOT NULL,
  count integer NOT NULL CHECK (count > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, motoboy_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_report_items TO authenticated;
GRANT ALL ON public.saved_report_items TO service_role;
ALTER TABLE public.saved_report_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Queue staff can view report items" ON public.saved_report_items FOR SELECT TO authenticated USING (public.has_company_access(company_id) AND (public.get_user_role() = 'admin' OR lower((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid())) = 'sofia'));
CREATE POLICY "Queue staff can create report items" ON public.saved_report_items FOR INSERT TO authenticated WITH CHECK (public.has_company_access(company_id) AND (public.get_user_role() = 'admin' OR lower((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid())) = 'sofia'));
CREATE POLICY "Queue staff can update report items" ON public.saved_report_items FOR UPDATE TO authenticated USING (public.has_company_access(company_id) AND (public.get_user_role() = 'admin' OR lower((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid())) = 'sofia')) WITH CHECK (public.has_company_access(company_id) AND (public.get_user_role() = 'admin' OR lower((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid())) = 'sofia'));
CREATE POLICY "Queue staff can delete report items" ON public.saved_report_items FOR DELETE TO authenticated USING (public.has_company_access(company_id) AND (public.get_user_role() = 'admin' OR lower((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid())) = 'sofia'));
CREATE INDEX saved_report_items_report ON public.saved_report_items (report_id);

CREATE TABLE public.queue_public_events (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  changed_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.queue_public_events TO anon, authenticated;
GRANT ALL ON public.queue_public_events TO service_role;
ALTER TABLE public.queue_public_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can receive queue refresh signals" ON public.queue_public_events FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.queue_public_events (id) VALUES (1);

CREATE OR REPLACE FUNCTION public.notify_queue_public_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.queue_public_events SET changed_at = now() WHERE id = 1;
  RETURN COALESCE(NEW, OLD);
END;
$$;
CREATE TRIGGER notify_queue_entries_public AFTER INSERT OR UPDATE OR DELETE ON public.queue_entries FOR EACH STATEMENT EXECUTE FUNCTION public.notify_queue_public_event();
CREATE TRIGGER notify_motoboy_queue_public AFTER UPDATE OF name, number, status, payment_status ON public.motoboys FOR EACH STATEMENT EXECUTE FUNCTION public.notify_queue_public_event();
ALTER PUBLICATION supabase_realtime ADD TABLE public.queue_public_events;

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
  IF v_company IS NULL OR NOT (public.get_user_role() = 'admin' OR lower((SELECT name FROM public.profiles WHERE id = auth.uid())) = 'sofia') THEN
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

CREATE OR REPLACE FUNCTION public.queue_finish_current()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_current uuid;
BEGIN
  v_company := public.get_user_company_id();
  IF v_company IS NULL OR NOT (public.get_user_role() = 'admin' OR lower((SELECT name FROM public.profiles WHERE id = auth.uid())) = 'sofia') THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  SELECT id INTO v_current FROM public.queue_entries WHERE company_id = v_company AND status = 'called' LIMIT 1 FOR UPDATE;
  IF v_current IS NOT NULL THEN UPDATE public.queue_entries SET status = 'finished', finished_at = now() WHERE id = v_current; END IF;
  RETURN v_current;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_finish_current() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.queue_finish_current() TO authenticated;

CREATE OR REPLACE FUNCTION public.queue_return_called(p_entry_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_company uuid;
BEGIN
  v_company := public.get_user_company_id();
  IF v_company IS NULL OR NOT (public.get_user_role() = 'admin' OR lower((SELECT name FROM public.profiles WHERE id = auth.uid())) = 'sofia') THEN RAISE EXCEPTION 'Acesso negado'; END IF;
  UPDATE public.queue_entries SET status = 'waiting', called_at = NULL, finished_at = NULL WHERE id = p_entry_id AND company_id = v_company AND status = 'called';
END;
$$;
REVOKE ALL ON FUNCTION public.queue_return_called(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.queue_return_called(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.queue_save_and_reset()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
  v_report uuid;
  v_total integer;
BEGIN
  v_company := public.get_user_company_id();
  IF v_company IS NULL OR NOT (public.get_user_role() = 'admin' OR lower((SELECT name FROM public.profiles WHERE id = auth.uid())) = 'sofia') THEN RAISE EXCEPTION 'Acesso negado'; END IF;
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
END;
$$;
REVOKE ALL ON FUNCTION public.queue_save_and_reset() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.queue_save_and_reset() TO authenticated;
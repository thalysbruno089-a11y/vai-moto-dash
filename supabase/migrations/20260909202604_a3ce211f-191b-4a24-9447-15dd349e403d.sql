
-- Auto-fill company from the user's profile
CREATE OR REPLACE FUNCTION public.set_company_from_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.company_id IS NULL THEN
    SELECT company_id INTO NEW.company_id FROM public.profiles WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ultra_deliveries','santa_luzia_deliveries','lagoinha_deliveries','burgazzo_deliveries']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_company_%1$s ON public.%1$I', t);
    EXECUTE format('CREATE TRIGGER set_company_%1$s BEFORE INSERT ON public.%1$I FOR EACH ROW EXECUTE FUNCTION public.set_company_from_profile()', t);

    -- drop all existing policies
    EXECUTE (
      SELECT coalesce(string_agg(format('DROP POLICY IF EXISTS %I ON public.%I;', policyname, t), ' '), '')
      FROM pg_policies WHERE schemaname='public' AND tablename=t
    );

    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('CREATE POLICY "company_select_%1$s" ON public.%1$I FOR SELECT TO authenticated USING (public.has_company_access(company_id))', t);
    EXECUTE format('CREATE POLICY "company_insert_%1$s" ON public.%1$I FOR INSERT TO authenticated WITH CHECK (public.has_company_access(company_id))', t);
    EXECUTE format('CREATE POLICY "company_update_%1$s" ON public.%1$I FOR UPDATE TO authenticated USING (public.has_company_access(company_id)) WITH CHECK (public.has_company_access(company_id))', t);
    EXECUTE format('CREATE POLICY "company_delete_%1$s" ON public.%1$I FOR DELETE TO authenticated USING (public.has_company_access(company_id))', t);
  END LOOP;
END $$;

-- Deletion logs: no more forged entries for other companies
DROP POLICY IF EXISTS "System inserts deletion logs" ON public.deletion_logs;
CREATE POLICY "Company members insert deletion logs"
ON public.deletion_logs FOR INSERT TO authenticated
WITH CHECK (public.has_company_access(company_id));
REVOKE ALL ON public.deletion_logs FROM anon;

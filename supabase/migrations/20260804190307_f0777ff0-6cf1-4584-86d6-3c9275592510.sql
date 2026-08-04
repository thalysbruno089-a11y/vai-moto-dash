CREATE TRIGGER trg_log_del_ultra_deliveries BEFORE DELETE ON public.ultra_deliveries FOR EACH ROW EXECUTE FUNCTION public.log_deletion();

CREATE POLICY "Company members view ultra deletion logs"
ON public.deletion_logs FOR SELECT
USING (table_name = 'ultra_deliveries' AND has_company_access(company_id));
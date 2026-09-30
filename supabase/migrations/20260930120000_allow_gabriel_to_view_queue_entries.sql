DROP POLICY IF EXISTS "Gabriel can view queue in his company" ON public.queue_entries;

CREATE POLICY "Gabriel can view queue in his company"
ON public.queue_entries
FOR SELECT TO authenticated
USING (
  auth.uid() = '9ac4e986-ff35-49af-a377-4dd9e281af4a'::uuid
  AND public.has_company_access(company_id)
);
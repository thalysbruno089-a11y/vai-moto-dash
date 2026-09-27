DROP POLICY IF EXISTS "Queue staff can delete entries" ON public.queue_entries;

CREATE POLICY "Queue staff can delete entries" ON public.queue_entries
FOR DELETE TO authenticated
USING (
  public.has_company_access(company_id)
  AND (
    public.get_user_role() = 'admin'
    OR lower((SELECT p.name FROM public.profiles p WHERE p.id = auth.uid())) = 'sofia'
    OR auth.uid() = '9ac4e986-ff35-49af-a377-4dd9e281af4a'::uuid
  )
);
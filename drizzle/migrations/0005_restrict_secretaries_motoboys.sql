DROP POLICY IF EXISTS "Users can update motoboys in their company" ON public.motoboys;
CREATE POLICY "Users can update motoboys in their company" ON public.motoboys FOR UPDATE
USING (has_company_access(company_id) AND auth.uid() NOT IN ('10902345-eb9b-4f1c-965b-0c121503fa08'::uuid, '9ac4e986-ff35-49af-a377-4dd9e281af4a'::uuid));
DROP POLICY IF EXISTS "Insert payment history in company" ON public.motoboy_payment_history;
CREATE POLICY "Insert payment history in company" ON public.motoboy_payment_history FOR INSERT
WITH CHECK (has_company_access(company_id) AND auth.uid() NOT IN ('10902345-eb9b-4f1c-965b-0c121503fa08'::uuid, '9ac4e986-ff35-49af-a377-4dd9e281af4a'::uuid));
DROP POLICY IF EXISTS "Delete payment history in company" ON public.motoboy_payment_history;
CREATE POLICY "Delete payment history in company" ON public.motoboy_payment_history FOR DELETE
USING (has_company_access(company_id) AND auth.uid() NOT IN ('10902345-eb9b-4f1c-965b-0c121503fa08'::uuid, '9ac4e986-ff35-49af-a377-4dd9e281af4a'::uuid));
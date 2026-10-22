DROP POLICY "Only admins can delete motoboys" ON public.motoboys;

CREATE POLICY "Admins and Sofia can delete motoboys"
ON public.motoboys
FOR DELETE
TO authenticated
USING (
  has_company_access(company_id)
  AND (
    get_user_role() = 'admin'::user_role
    OR auth.uid() = '29eb69f6-4984-4473-a8b6-3352b1758576'::uuid
  )
);
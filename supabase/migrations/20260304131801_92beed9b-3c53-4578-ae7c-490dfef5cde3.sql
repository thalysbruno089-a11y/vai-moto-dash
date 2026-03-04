
-- Allow admins to update any profile in their company
CREATE POLICY "Admins can update profiles in their company"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  has_company_access(company_id) AND get_user_role() = 'admin'::user_role
);

-- Drop existing delete policy
DROP POLICY IF EXISTS "Users can delete motoboys in their company" ON public.motoboys;

-- Create new policy that only allows admins to delete
CREATE POLICY "Only admins can delete motoboys" 
ON public.motoboys 
FOR DELETE 
USING (
  has_company_access(company_id) 
  AND get_user_role() = 'admin'
);
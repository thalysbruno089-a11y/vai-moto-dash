DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
CREATE POLICY "Authenticated company members can view profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_company_access(company_id));
DROP POLICY IF EXISTS "Admins can update profiles in their company" ON public.profiles;
CREATE POLICY "Admins can update profiles in their company" ON public.profiles FOR UPDATE TO authenticated USING (public.has_company_access(company_id) AND public.get_user_role() = 'admin') WITH CHECK (public.has_company_access(company_id) AND public.get_user_role() = 'admin');

REVOKE ALL ON FUNCTION public.get_user_company_id() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_user_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_company_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_company_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_company_access(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.log_deletion() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_ride_paid_to_carlos_bank() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_company_from_profile() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_deletion() TO service_role;
GRANT EXECUTE ON FUNCTION public.log_ride_paid_to_carlos_bank() TO service_role;
GRANT EXECUTE ON FUNCTION public.set_company_from_profile() TO service_role;
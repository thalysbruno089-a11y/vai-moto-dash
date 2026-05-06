CREATE TABLE public.client_pix_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  client_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  paid_at timestamp with time zone,
  created_by uuid,
  paid_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.client_pix_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View pix requests in company"
ON public.client_pix_requests FOR SELECT
USING (has_company_access(company_id));

CREATE POLICY "Insert pix requests in company"
ON public.client_pix_requests FOR INSERT
WITH CHECK (has_company_access(company_id));

CREATE POLICY "Only admins can update pix requests"
ON public.client_pix_requests FOR UPDATE
USING (has_company_access(company_id) AND get_user_role() = 'admin'::user_role);

CREATE POLICY "Delete pix requests in company"
ON public.client_pix_requests FOR DELETE
USING (has_company_access(company_id));

CREATE INDEX idx_client_pix_requests_company ON public.client_pix_requests(company_id);
CREATE INDEX idx_client_pix_requests_client ON public.client_pix_requests(client_id);

CREATE TRIGGER update_client_pix_requests_updated_at
BEFORE UPDATE ON public.client_pix_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.motorcycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id),
  plate text NOT NULL,
  name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.motorcycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view motorcycles in their company" ON public.motorcycles FOR SELECT USING (has_company_access(company_id));
CREATE POLICY "Users can insert motorcycles in their company" ON public.motorcycles FOR INSERT WITH CHECK (has_company_access(company_id));
CREATE POLICY "Users can update motorcycles in their company" ON public.motorcycles FOR UPDATE USING (has_company_access(company_id));
CREATE POLICY "Users can delete motorcycles in their company" ON public.motorcycles FOR DELETE USING (has_company_access(company_id));

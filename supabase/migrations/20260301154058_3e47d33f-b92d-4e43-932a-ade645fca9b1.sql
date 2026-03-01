
-- Add plate field to motorcycle_expenses to separate by motorcycle
ALTER TABLE public.motorcycle_expenses ADD COLUMN plate TEXT NULL;

-- Add pix_key field to motoboys
ALTER TABLE public.motoboys ADD COLUMN pix_key TEXT NULL;

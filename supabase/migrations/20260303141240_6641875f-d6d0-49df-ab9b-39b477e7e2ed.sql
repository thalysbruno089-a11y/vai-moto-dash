
-- Add vale_amount column to bills for tracking employee advances
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS vale_amount numeric DEFAULT 0;

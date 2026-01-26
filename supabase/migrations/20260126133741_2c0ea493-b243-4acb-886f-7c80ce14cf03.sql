-- Add weekly payment and number fields to motoboys table
ALTER TABLE public.motoboys 
ADD COLUMN weekly_payment numeric DEFAULT 0,
ADD COLUMN number text;
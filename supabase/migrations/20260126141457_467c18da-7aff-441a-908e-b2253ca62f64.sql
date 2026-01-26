-- Add payment_status column to motoboys table
ALTER TABLE public.motoboys 
ADD COLUMN payment_status text DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending'));
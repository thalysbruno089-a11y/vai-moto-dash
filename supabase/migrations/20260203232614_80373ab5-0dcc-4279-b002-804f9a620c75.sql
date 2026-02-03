-- Add installment tracking columns to bills table
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS total_installments integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS paid_installments integer DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.bills.total_installments IS 'Total number of installments for this bill (NULL if not an installment bill)';
COMMENT ON COLUMN public.bills.paid_installments IS 'Number of installments already paid';
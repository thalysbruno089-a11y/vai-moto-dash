-- Add category_id and is_fixed columns to bills table
ALTER TABLE public.bills 
ADD COLUMN category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
ADD COLUMN is_fixed boolean NOT NULL DEFAULT false;

-- Create index for category_id
CREATE INDEX idx_bills_category_id ON public.bills(category_id);

-- Create function to auto-update overdue status
CREATE OR REPLACE FUNCTION public.update_bill_overdue_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Only update to overdue if: pending, due_date is past, and not already paid
  IF NEW.status = 'pending' AND NEW.due_date < CURRENT_DATE AND NEW.paid_at IS NULL THEN
    NEW.status := 'overdue';
  END IF;
  -- If due_date is in future or today, ensure status is pending (not overdue)
  IF NEW.status = 'overdue' AND NEW.due_date >= CURRENT_DATE AND NEW.paid_at IS NULL THEN
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for auto-updating overdue status on insert/update
CREATE TRIGGER check_bill_overdue_status
BEFORE INSERT OR UPDATE ON public.bills
FOR EACH ROW
EXECUTE FUNCTION public.update_bill_overdue_status();

-- Fix existing bills with wrong overdue status (future dates marked as overdue)
UPDATE public.bills 
SET status = 'pending' 
WHERE status = 'overdue' AND due_date >= CURRENT_DATE AND paid_at IS NULL;

ALTER TABLE public.motoboy_payment_history
  ADD COLUMN IF NOT EXISTS pix_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cash_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS other_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS shift text;

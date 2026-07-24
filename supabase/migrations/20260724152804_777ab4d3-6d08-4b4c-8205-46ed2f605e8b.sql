ALTER TABLE public.ultra_deliveries
  ADD COLUMN IF NOT EXISTS saiu_maquina boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS devolveu_maquina boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dinheiro_devolvido boolean NOT NULL DEFAULT false;
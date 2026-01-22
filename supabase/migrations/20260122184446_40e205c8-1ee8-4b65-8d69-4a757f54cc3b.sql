-- Adiciona coluna de endereço na tabela motoboys
ALTER TABLE public.motoboys ADD COLUMN IF NOT EXISTS address text;
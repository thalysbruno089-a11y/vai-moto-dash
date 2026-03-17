
-- Add group_name column to categories for CARLOS/CENTRAL separation
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS group_name text NOT NULL DEFAULT 'carlos';

-- Assign CENTRAL categories
UPDATE public.categories SET group_name = 'central' WHERE id IN (
  'a2f30604-6ac1-47c9-8423-c7697be4ef4f', -- AUXILIO ACIDENTTE
  '12c49ba7-0491-4c0a-832a-3647c38904c9', -- CLICK DISQUE
  '6d20375b-4d3d-4efb-9dac-cd0de3fbe202', -- CONTABILIDADE
  'ba339adf-d93b-426d-9e4d-f84d25f589a5', -- FUMPAR APE E DOAÇÔES (DOAÇÕES)
  'ca32e161-b941-47a2-96ba-e5422d49a221', -- ITENS PARA CENTRAL
  'b512226f-ddd5-40fd-a29d-5395c6d616a4', -- INTENET TELEFONE
  '7b7900cf-5f8c-4b34-bba9-9fdc4c816624'  -- marketing
);

-- Assign CARLOS categories (these stay as default 'carlos')
-- GASOLINA, CARRRO, CARTAO DA MI, FARMACIA, MERCADO, ROLE, SPORTES, TOBIAS already default to carlos

-- For shared categories (AGIOTA, AGUA, ALUGUEL, ENERGIA) - assign existing to CENTRAL, create new for CARLOS
UPDATE public.categories SET group_name = 'central' WHERE id IN (
  'fec19e64-7289-4b58-a257-f445bebe5c13', -- AGIOTA -> central
  'a14de6e4-9982-4191-8383-56bf006ddc86', -- AGUA -> central
  '9f8cbb36-bd87-4f11-a8f6-84681480058a', -- ALUGUEL -> central
  'd04b742b-0d3e-4338-b999-79d6ab59aa75'  -- ENERGIA -> central
);

-- Remove unused category "CARLOS" which was a group name used as category
-- and other uncategorized ones
UPDATE public.categories SET group_name = 'carlos' WHERE id IN (
  '5711c579-973a-447e-a30b-2f538721ff61', -- CARLOS (keep but assign to carlos)
  '29b40674-2444-476a-b2ea-04e77af9fffa', -- cuidadora
  '7a6d2379-d905-499a-98a6-924ebab5a3b4', -- FUNCIONARIOS
  'ac1c0bee-4c4c-4ba9-ac0c-af92d6d71778'  -- PREJUIZOS
);

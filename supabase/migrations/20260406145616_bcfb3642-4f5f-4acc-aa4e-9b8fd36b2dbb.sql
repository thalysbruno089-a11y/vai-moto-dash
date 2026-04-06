
-- Fix MERCADO BRUMAR bills that were paid but not updated
UPDATE bills SET status = 'paid', paid_at = now() WHERE id IN ('e56b5b2d-ba25-43e0-99f0-a21299695f55', '7dd18fe3-2875-4f78-a60e-9a06f91d38b4');

-- Remove duplicate cash_flow entries for MERCADO BRUMAR (4/5) - keep only one
DELETE FROM cash_flow WHERE id IN ('f3cfdbcb-b666-4537-952a-70ab86f17e5f', '8556ca2c-67c2-4257-b268-288b0fa1c2fe');

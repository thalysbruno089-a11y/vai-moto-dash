ALTER TABLE public.queue_entries DROP CONSTRAINT queue_entries_motoboy_id_fkey;
ALTER TABLE public.queue_entries ADD CONSTRAINT queue_entries_motoboy_id_fkey FOREIGN KEY (motoboy_id) REFERENCES public.motoboys(id) ON DELETE CASCADE;
ALTER TABLE public.saved_report_items DROP CONSTRAINT saved_report_items_motoboy_id_fkey;
COMMENT ON COLUMN public.saved_report_items.motoboy_id IS 'Historical reference; no FK so saved reports survive motoboy deletion (name/code are snapshotted).';
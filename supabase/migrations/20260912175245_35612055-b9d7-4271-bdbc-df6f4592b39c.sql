ALTER FUNCTION public.notify_queue_public_event() SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.notify_queue_public_event() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_queue_public_event() TO service_role;

ALTER FUNCTION public.queue_call_next() SECURITY INVOKER;
ALTER FUNCTION public.queue_finish_current() SECURITY INVOKER;
ALTER FUNCTION public.queue_return_called(uuid) SECURITY INVOKER;
ALTER FUNCTION public.queue_save_and_reset() SECURITY INVOKER;

REVOKE ALL ON FUNCTION public.queue_call_next() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.queue_finish_current() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.queue_return_called(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.queue_save_and_reset() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.queue_call_next() TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_finish_current() TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_return_called(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_save_and_reset() TO authenticated;
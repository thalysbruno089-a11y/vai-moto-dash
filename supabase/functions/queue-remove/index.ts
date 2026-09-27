import { createClient } from 'npm:@supabase/supabase-js@2.91.0'
import { z } from 'npm:zod@3.25.76'
import { verifyQueueRemovalToken } from '../_shared/queueRemovalToken.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BodySchema = z.object({ token: z.string().min(1).max(4096) })

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405)

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) return json({ ok: false, error: 'Confira o código informado.' })

    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !serviceKey) return json({ ok: false, error: 'Serviço indisponível' }, 503)

    const entryId = await verifyQueueRemovalToken(parsed.data.token, serviceKey)
    if (!entryId) return json({ ok: false, error: 'Não foi possível confirmar sua entrada na fila.' }, 403)

    const db = createClient(url, serviceKey, { auth: { persistSession: false } })
    const { data: removed, error: removeError } = await db.from('queue_entries')
      .delete()
      .eq('id', entryId)
      .in('status', ['waiting', 'called'])
      .select('id')
      .maybeSingle()

    if (removeError) return json({ ok: false, error: 'Não foi possível remover da fila.' }, 500)
    if (!removed) return json({ ok: false, error: 'Essa entrada não está mais na fila.' })

    return json({ ok: true })
  } catch {
    return json({ ok: false, error: 'Não foi possível remover da fila agora.' }, 500)
  }
})
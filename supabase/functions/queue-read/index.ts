import { createClient } from 'npm:@supabase/supabase-js@2.91.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405)

  try {
    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !serviceKey) return json({ error: 'Serviço indisponível' }, 503)

    const db = createClient(url, serviceKey, { auth: { persistSession: false } })
    const { data: company } = await db.from('companies').select('id').order('created_at').limit(1).maybeSingle()
    if (!company) return json({ called: null, waiting: [], updatedAt: new Date().toISOString() })

    const { data, error } = await db
      .from('queue_entries')
      .select('id, status, position, joined_at, called_at, motoboys!inner(name, number)')
      .eq('company_id', company.id)
      .in('status', ['waiting', 'called'])
      .order('position', { ascending: true })

    if (error) return json({ error: 'Não foi possível carregar a fila' }, 500)

    const entries = (data ?? []).map((entry) => {
      const motoboy = Array.isArray(entry.motoboys) ? entry.motoboys[0] : entry.motoboys
      return {
        id: entry.id,
        status: entry.status,
        position: Number(entry.position),
        joinedAt: entry.joined_at,
        calledAt: entry.called_at,
        code: motoboy?.number ?? '—',
        name: motoboy?.name ?? 'Motoboy',
      }
    })

    return json({
      called: entries.find((entry) => entry.status === 'called') ?? null,
      waiting: entries.filter((entry) => entry.status === 'waiting'),
      updatedAt: new Date().toISOString(),
    })
  } catch {
    return json({ error: 'Não foi possível carregar a fila' }, 500)
  }
})
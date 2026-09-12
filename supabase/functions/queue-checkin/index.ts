import { createClient } from 'npm:@supabase/supabase-js@2.91.0'
import { z } from 'npm:zod@3.25.76'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BodySchema = z.object({ code: z.string().trim().regex(/^\d{1,6}$/) })
const attempts = new Map<string, { count: number; resetAt: number }>()

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405)

  try {
    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) return json({ ok: false, error: 'Digite um número válido' })

    const clientKey = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const now = Date.now()
    const current = attempts.get(clientKey)
    if (current && current.resetAt > now && current.count >= 20) {
      return json({ ok: false, error: 'Muitas tentativas. Aguarde alguns minutos.' })
    }

    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!url || !serviceKey) return json({ ok: false, error: 'Serviço indisponível' })
    const db = createClient(url, serviceKey, { auth: { persistSession: false } })

    const { data: matches, error: motoboyError } = await db
      .from('motoboys')
      .select('id, company_id, name, number, status, payment_status')
      .eq('number', parsed.data.code)
      .limit(2)

    const motoboy = matches?.length === 1 ? matches[0] : null
    if (motoboyError || !motoboy) {
      attempts.set(clientKey, {
        count: current && current.resetAt > now ? current.count + 1 : 1,
        resetAt: current && current.resetAt > now ? current.resetAt : now + 10 * 60 * 1000,
      })
      return json({ ok: false, error: 'Número não encontrado' })
    }
    if (motoboy.status !== 'active') return json({ ok: false, error: 'Seu cadastro está inativo. Procure a administração.' })
    if (motoboy.payment_status !== 'paid') return json({ ok: false, error: 'Seu pagamento está pendente. Regularize para entrar na fila.' })

    const { data: existing } = await db
      .from('queue_entries')
      .select('id, status')
      .eq('company_id', motoboy.company_id)
      .eq('motoboy_id', motoboy.id)
      .in('status', ['waiting', 'called'])
      .maybeSingle()
    if (existing) return json({ ok: false, error: 'Você já está na fila.' })

    const { data: last } = await db
      .from('queue_entries')
      .select('position')
      .eq('company_id', motoboy.company_id)
      .order('position', { ascending: false })
      .limit(1)
      .maybeSingle()

    const { data: entry, error: insertError } = await db.from('queue_entries').insert({
      company_id: motoboy.company_id,
      motoboy_id: motoboy.id,
      position: Number(last?.position ?? 0) + 1,
      status: 'waiting',
    }).select('id').single()

    if (insertError) {
      if (insertError.code === '23505') return json({ ok: false, error: 'Você já está na fila.' })
      return json({ ok: false, error: 'Não foi possível entrar na fila' })
    }

    attempts.delete(clientKey)
    const { count } = await db.from('queue_entries').select('id', { count: 'exact', head: true })
      .eq('company_id', motoboy.company_id).eq('status', 'waiting')

    return json({ ok: true, entryId: entry.id, name: motoboy.name, code: motoboy.number, position: count ?? 1 })
  } catch {
    return json({ ok: false, error: 'Não foi possível entrar na fila agora' })
  }
})
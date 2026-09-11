import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const encoder = new TextEncoder()
const attempts = new Map<string, { count: number; resetAt: number }>()

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
})

const toBase64Url = (value: Uint8Array | string) => {
  const bytes = typeof value === 'string' ? encoder.encode(value) : value
  let binary = ''
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

const sign = async (payload: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return toBase64Url(new Uint8Array(signature))
}

const createToken = async (motoboyId: string, secret: string) => {
  const payload = toBase64Url(JSON.stringify({ sub: motoboyId, exp: Date.now() + 12 * 60 * 60 * 1000 }))
  return `${payload}.${await sign(payload, secret)}`
}

const readToken = async (token: string, secret: string) => {
  const [payload, providedSignature] = token.split('.')
  if (!payload || !providedSignature || await sign(payload, secret) !== providedSignature) return null
  try {
    const normalized = payload.replaceAll('-', '+').replaceAll('_', '/')
    const decoded = JSON.parse(atob(normalized)) as { sub?: string; exp?: number }
    if (!decoded.sub || !decoded.exp || decoded.exp < Date.now()) return null
    return decoded.sub
  } catch {
    return null
  }
}

const normalize = (value: unknown) => String(value ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405)

  try {
    const url = Deno.env.get('SUPABASE_URL')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const sessionSecret = Deno.env.get('MOTOBOY_BENEFITS_SESSION_SECRET')
    if (!url || !serviceKey || !sessionSecret) return json({ error: 'Serviço indisponível' }, 503)

    const body = await req.json().catch(() => ({})) as { action?: string; code?: string; password?: string; token?: string }
    const db = createClient(url, serviceKey, { auth: { persistSession: false } })

    if (body.action === 'session') {
      const motoboyId = await readToken(String(body.token ?? ''), sessionSecret)
      if (!motoboyId) return json({ error: 'Sessão expirada' }, 401)
      const { data, error } = await db.from('motoboys')
        .select('id, name, number, plate, status, payment_status')
        .eq('id', motoboyId)
        .maybeSingle()
      if (error || !data) return json({ error: 'Acesso não encontrado' }, 401)
      return json({ motoboy: data })
    }

    const clientKey = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const now = Date.now()
    const current = attempts.get(clientKey)
    if (current && current.resetAt > now && current.count >= 5) {
      return json({ error: 'Muitas tentativas. Aguarde alguns minutos.' }, 429)
    }

    const code = normalize(body.code)
    const password = normalize(body.password)
    if (!code || password.length !== 2) return json({ error: 'Código ou senha incorretos' }, 401)

    const { data, error } = await db.from('motoboys')
      .select('id, name, number, plate, status, payment_status')
      .eq('number', code)
      .limit(2)

    const motoboy = data?.length === 1 ? data[0] : null
    const plateEnd = normalize(motoboy?.plate).slice(-2)
    if (error || !motoboy || !plateEnd || plateEnd !== password) {
      attempts.set(clientKey, {
        count: current && current.resetAt > now ? current.count + 1 : 1,
        resetAt: current && current.resetAt > now ? current.resetAt : now + 10 * 60 * 1000,
      })
      return json({ error: 'Código ou senha incorretos' }, 401)
    }

    attempts.delete(clientKey)
    return json({ motoboy, token: await createToken(motoboy.id, sessionSecret) })
  } catch {
    return json({ error: 'Não foi possível entrar agora' }, 500)
  }
})
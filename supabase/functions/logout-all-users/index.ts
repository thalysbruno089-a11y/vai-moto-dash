import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = Deno.env.get('SUPABASE_URL')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const admin = createClient(url, serviceKey)

  let page = 1
  let total = 0
  const errors: string[] = []

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (!data.users.length) break

    for (const u of data.users) {
      // Ban briefly to revoke all active sessions, then unban
      const ban = await admin.auth.admin.updateUserById(u.id, { ban_duration: '1h' } as any)
      if (ban.error) { errors.push(`${u.id} ban: ${ban.error.message}`); continue }
      const unban = await admin.auth.admin.updateUserById(u.id, { ban_duration: 'none' } as any)
      if (unban.error) { errors.push(`${u.id} unban: ${unban.error.message}`); continue }
      total++
    }

    if (data.users.length < 1000) break
    page++
  }

  return new Response(JSON.stringify({ signed_out: total, errors }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})
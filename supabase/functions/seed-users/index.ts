import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's auth context
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Use service role client for operations
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // Verify user is an admin
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const companyId = callerProfile.company_id
    if (!companyId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin has no company' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { users } = await req.json()
    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Users array required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate users
    const validRoles = ['admin', 'manager', 'finance', 'employee']
    for (const u of users) {
      if (!u.username || u.username.length < 3) {
        return new Response(
          JSON.stringify({ success: false, error: 'Username min 3 chars' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (!u.password || u.password.length < 8) {
        return new Response(
          JSON.stringify({ success: false, error: 'Password min 8 chars' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (!u.name) {
        return new Response(
          JSON.stringify({ success: false, error: 'Name required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (!u.role || !validRoles.includes(u.role)) {
        return new Response(
          JSON.stringify({ success: false, error: `Role must be one of: ${validRoles.join(', ')}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const results = []

    for (const u of users) {
      const email = `${u.username}@vaimoto.app`
      
      // Check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(eu => eu.email === email)

      if (existingUser) {
        await supabase.auth.admin.updateUserById(existingUser.id, { password: u.password })
        await supabase.from('profiles').upsert({
          id: existingUser.id,
          name: u.name,
          role: u.role,
          company_id: companyId
        })
        results.push({ user: u.username, status: 'updated' })
      } else {
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: u.password,
          email_confirm: true
        })

        if (authError) {
          results.push({ user: u.username, status: 'error', error: authError.message })
          continue
        }

        await supabase.from('profiles').insert({
          id: authUser.user.id,
          name: u.name,
          role: u.role,
          company_id: companyId
        })
        results.push({ user: u.username, status: 'created' })
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

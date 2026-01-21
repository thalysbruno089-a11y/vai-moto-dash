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
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // First, create or get the default company
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('name', 'Vai Moto')
      .maybeSingle()

    let companyId: string

    if (existingCompany) {
      companyId = existingCompany.id
    } else {
      const { data: newCompany, error: companyError } = await supabase
        .from('companies')
        .insert({ name: 'Vai Moto' })
        .select('id')
        .single()

      if (companyError) throw companyError
      companyId = newCompany.id
    }

    // Define the users to create
    const users = [
      { username: 'sofia', password: '142536', name: 'Sofia', role: 'manager' as const },
      { username: 'carlos', password: '748596', name: 'Carlos Braga', role: 'admin' as const },
      { username: 'sophia', password: '362514', name: 'Sophia', role: 'manager' as const },
    ]

    const results = []

    for (const user of users) {
      const email = `${user.username}@vaimoto.app`
      
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers?.users?.find(u => u.email === email)

      if (existingUser) {
        // Update password if user exists
        await supabase.auth.admin.updateUserById(existingUser.id, {
          password: user.password
        })

        // Update profile
        await supabase
          .from('profiles')
          .upsert({
            id: existingUser.id,
            name: user.name,
            role: user.role,
            company_id: companyId
          })

        results.push({ user: user.username, status: 'updated' })
      } else {
        // Create new user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: user.password,
          email_confirm: true
        })

        if (authError) {
          results.push({ user: user.username, status: 'error', error: authError.message })
          continue
        }

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.user.id,
            name: user.name,
            role: user.role,
            company_id: companyId
          })

        if (profileError) {
          results.push({ user: user.username, status: 'error', error: profileError.message })
          continue
        }

        results.push({ user: user.username, status: 'created' })
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

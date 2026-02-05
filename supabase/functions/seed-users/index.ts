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
      console.error('Missing or invalid Authorization header')
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Missing authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create client with user's auth context to validate JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify the JWT and get claims
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token)
    
    if (claimsError || !claimsData?.claims) {
      console.error('JWT verification failed:', claimsError)
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claimsData.claims.sub
    console.log(`Authenticated user: ${userId}`)

    // Use service role client for operations
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify user is an admin
    const { data: callerProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', userId)
      .single()

    if (profileError || !callerProfile) {
      console.error('Failed to fetch user profile:', profileError)
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: User profile not found' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (callerProfile.role !== 'admin') {
      console.error(`Access denied: User ${userId} has role ${callerProfile.role}, admin required`)
      return new Response(
        JSON.stringify({ success: false, error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body - passwords must be provided by the caller
    let requestBody
    try {
      requestBody = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid request body: JSON expected' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { users } = requestBody

    // Validate users array
    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid request: users array required with format [{ username, password, name, role }]' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate each user object
    for (const user of users) {
      if (!user.username || typeof user.username !== 'string' || user.username.length < 3) {
        return new Response(
          JSON.stringify({ success: false, error: 'Each user must have a valid username (min 3 chars)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (!user.password || typeof user.password !== 'string' || user.password.length < 8) {
        return new Response(
          JSON.stringify({ success: false, error: 'Each user must have a password (min 8 chars)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (!user.name || typeof user.name !== 'string') {
        return new Response(
          JSON.stringify({ success: false, error: 'Each user must have a name' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (!user.role || !['admin', 'manager', 'finance', 'employee'].includes(user.role)) {
        return new Response(
          JSON.stringify({ success: false, error: 'Each user must have a valid role (admin, manager, finance, or employee)' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get the company ID from caller's profile
    const companyId = callerProfile.company_id
    if (!companyId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Admin user has no company assigned' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

        console.log(`Updated user: ${user.username}`)
        results.push({ user: user.username, status: 'updated' })
      } else {
        // Create new user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email,
          password: user.password,
          email_confirm: true
        })

        if (authError) {
          console.error(`Error creating user ${user.username}:`, authError)
          results.push({ user: user.username, status: 'error', error: authError.message })
          continue
        }

        // Create profile
        const { error: profileCreateError } = await supabase
          .from('profiles')
          .insert({
            id: authUser.user.id,
            name: user.name,
            role: user.role,
            company_id: companyId
          })

        if (profileCreateError) {
          console.error(`Error creating profile for ${user.username}:`, profileCreateError)
          results.push({ user: user.username, status: 'error', error: profileCreateError.message })
          continue
        }

        console.log(`Created user: ${user.username}`)
        results.push({ user: user.username, status: 'created' })
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    console.error('Unexpected error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

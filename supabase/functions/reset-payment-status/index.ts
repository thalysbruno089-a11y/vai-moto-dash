import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.91.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid Authorization header')
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
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
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const userId = claimsData.claims.sub
    console.log(`Authenticated user: ${userId}`)

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, company_id')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      console.error('Failed to fetch user profile:', profileError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized: User profile not found' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (profile.role !== 'admin') {
      console.error(`Access denied: User ${userId} has role ${profile.role}, admin required`)
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Reset all motoboys payment_status to 'pending' for the user's company only
    const { data, error } = await supabase
      .from('motoboys')
      .update({ payment_status: 'pending' })
      .eq('company_id', profile.company_id)
      .neq('payment_status', 'pending')
      .select('id')

    if (error) {
      console.error('Error resetting payment status:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`Admin ${userId} reset payment status for ${data?.length || 0} motoboys in company ${profile.company_id}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Reset payment status for ${data?.length || 0} motoboys`,
        resetCount: data?.length || 0
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (err) {
    console.error('Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: 'Unexpected error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

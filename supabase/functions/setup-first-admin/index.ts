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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Handle GET request - check if system has users
    if (req.method === 'GET') {
      const { count, error } = await adminClient
        .from('allowed_users')
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.error('Error checking users:', error)
        throw error
      }

      console.log('System user count:', count)

      return new Response(
        JSON.stringify({ hasUsers: (count ?? 0) > 0, count }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Handle POST request - create first admin
    const { email, password, name } = await req.json()

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if there are any users in allowed_users
    const { count, error: countError } = await adminClient
      .from('allowed_users')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('Error checking users:', countError)
      throw countError
    }

    // If users exist, don't allow setup - require invite
    if ((count ?? 0) > 0) {
      return new Response(
        JSON.stringify({ error: 'System already has users. Please use invite system.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('No users in system, creating first admin:', email)

    // Create the user in auth
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (createError) {
      console.error('Error creating auth user:', createError)
      throw createError
    }

    // Add to allowed_users as admin
    const { error: insertError } = await adminClient
      .from('allowed_users')
      .insert({
        email,
        name: name || email.split('@')[0],
        role: 'admin',
      })

    if (insertError) {
      console.error('Error adding to allowed_users:', insertError)
      // Rollback - delete the auth user
      await adminClient.auth.admin.deleteUser(newUser.user.id)
      throw insertError
    }

    console.log('Successfully created first admin:', email)

    return new Response(
      JSON.stringify({ success: true, message: 'First admin created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: unknown) {
    console.error('Error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

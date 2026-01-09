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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Create client with user's token to verify they're admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    // Verify the user's token and get their email
    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await userClient.auth.getUser(token)
    
    if (claimsError || !claimsData?.user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userEmail = claimsData.user.email

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await userClient.rpc('is_admin', { _email: userEmail })
    
    if (adminError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Only admins can delete users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prevent self-deletion
    if (email === userEmail) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Check if the user to delete is an admin
    const { data: userToDeleteData, error: checkUserError } = await adminClient
      .from('allowed_users')
      .select('role')
      .eq('email', email)
      .single()

    if (checkUserError) {
      console.error('Error checking user:', checkUserError)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // If the user is an admin, check if they're the last one
    if (userToDeleteData.role === 'admin') {
      const { count, error: countError } = await adminClient
        .from('allowed_users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')

      if (countError) {
        console.error('Error counting admins:', countError)
        throw countError
      }

      if ((count ?? 0) <= 1) {
        console.log('Attempted to delete last admin:', email)
        return new Response(
          JSON.stringify({ error: 'Не можете да изтриете последния администратор. Винаги трябва да има поне един администратор в системата.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get the user ID from auth
    const { data: users, error: listError } = await adminClient.auth.admin.listUsers()
    
    if (listError) throw listError

    const userToDelete = users.users.find(u => u.email === email)

    // Delete from allowed_users first
    const { error: deleteAllowedError } = await adminClient
      .from('allowed_users')
      .delete()
      .eq('email', email)

    if (deleteAllowedError) throw deleteAllowedError

    // Delete from auth if exists
    if (userToDelete) {
      const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(userToDelete.id)
      if (deleteAuthError) throw deleteAuthError
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
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
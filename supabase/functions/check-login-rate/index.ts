import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MINUTES = 15

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // Get client IP from various headers
    const forwardedFor = req.headers.get('x-forwarded-for')
    const realIp = req.headers.get('x-real-ip')
    const cfConnectingIp = req.headers.get('cf-connecting-ip')
    const clientIp = cfConnectingIp || (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) || 'unknown'

    const { action, email } = await req.json()

    if (action === 'check') {
      // Check if IP is blocked
      const blockTime = new Date(Date.now() - BLOCK_DURATION_MINUTES * 60 * 1000).toISOString()
      
      const { data: attempts, error } = await adminClient
        .from('login_attempts')
        .select('id')
        .eq('ip_address', clientIp)
        .eq('success', false)
        .gte('attempt_time', blockTime)

      if (error) {
        console.error('Error checking login attempts:', error)
        throw error
      }

      const failedAttempts = attempts?.length || 0
      const isBlocked = failedAttempts >= MAX_ATTEMPTS

      let remainingTime = 0
      if (isBlocked) {
        // Calculate remaining block time
        const { data: lastAttempt } = await adminClient
          .from('login_attempts')
          .select('attempt_time')
          .eq('ip_address', clientIp)
          .eq('success', false)
          .order('attempt_time', { ascending: false })
          .limit(1)
          .single()

        if (lastAttempt) {
          const lastAttemptTime = new Date(lastAttempt.attempt_time).getTime()
          const unblockTime = lastAttemptTime + (BLOCK_DURATION_MINUTES * 60 * 1000)
          remainingTime = Math.ceil((unblockTime - Date.now()) / 1000 / 60)
        }
      }

      return new Response(
        JSON.stringify({ 
          blocked: isBlocked, 
          attempts: failedAttempts,
          remainingMinutes: remainingTime,
          maxAttempts: MAX_ATTEMPTS
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'record_failure') {
      // Record a failed login attempt
      const { error } = await adminClient
        .from('login_attempts')
        .insert({
          ip_address: clientIp,
          email: email || null,
          success: false
        })

      if (error) {
        console.error('Error recording failed attempt:', error)
        throw error
      }

      // Check current failure count
      const blockTime = new Date(Date.now() - BLOCK_DURATION_MINUTES * 60 * 1000).toISOString()
      const { data: attempts } = await adminClient
        .from('login_attempts')
        .select('id')
        .eq('ip_address', clientIp)
        .eq('success', false)
        .gte('attempt_time', blockTime)

      const failedAttempts = attempts?.length || 0
      const remainingAttempts = Math.max(0, MAX_ATTEMPTS - failedAttempts)

      console.log(`Failed login attempt from IP: ${clientIp}, email: ${email}, total failures: ${failedAttempts}`)

      return new Response(
        JSON.stringify({ 
          recorded: true, 
          remainingAttempts,
          blocked: failedAttempts >= MAX_ATTEMPTS
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'record_success') {
      // Record a successful login and clear previous failed attempts for this IP
      const { error: insertError } = await adminClient
        .from('login_attempts')
        .insert({
          ip_address: clientIp,
          email: email || null,
          success: true
        })

      if (insertError) {
        console.error('Error recording success:', insertError)
      }

      // Delete old failed attempts for this IP (optional - cleanup)
      const { error: deleteError } = await adminClient
        .from('login_attempts')
        .delete()
        .eq('ip_address', clientIp)
        .eq('success', false)

      if (deleteError) {
        console.error('Error clearing failed attempts:', deleteError)
      }

      console.log(`Successful login from IP: ${clientIp}, email: ${email}`)

      return new Response(
        JSON.stringify({ recorded: true, cleared: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

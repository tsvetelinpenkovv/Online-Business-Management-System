import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token, expectedAction } = await req.json();

    if (!token) {
      console.error('No reCAPTCHA token provided');
      return new Response(
        JSON.stringify({ success: false, error: 'No token provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const secretKey = Deno.env.get('RECAPTCHA_SECRET_KEY');
    
    if (!secretKey) {
      console.error('RECAPTCHA_SECRET_KEY not configured');
      // If no secret key is configured, allow the request (reCAPTCHA not enabled)
      return new Response(
        JSON.stringify({ success: true, score: 1.0, message: 'reCAPTCHA not configured, skipping verification' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the token with Google reCAPTCHA API
    const verifyUrl = 'https://www.google.com/recaptcha/api/siteverify';
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const verifyData = await verifyResponse.json();
    console.log('reCAPTCHA verification response:', JSON.stringify(verifyData));

    if (!verifyData.success) {
      console.error('reCAPTCHA verification failed:', verifyData['error-codes']);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Verification failed',
          errorCodes: verifyData['error-codes'] 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For reCAPTCHA v3, check the score and action
    const score = verifyData.score || 1.0;
    const action = verifyData.action;

    // If expected action is provided, verify it matches
    if (expectedAction && action !== expectedAction) {
      console.error(`Action mismatch: expected ${expectedAction}, got ${action}`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Action mismatch',
          expectedAction,
          actualAction: action
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        score,
        action,
        hostname: verifyData.hostname,
        challengeTs: verifyData.challenge_ts
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error verifying reCAPTCHA:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

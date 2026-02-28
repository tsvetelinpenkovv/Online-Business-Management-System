import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || req.headers.get('cf-connecting-ip')
    || '0.0.0.0';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const ip = getClientIP(req);

  if (req.method === 'GET') {
    const { data } = await supabase
      .from('theme_preferences')
      .select('theme')
      .eq('ip_address', ip)
      .maybeSingle();

    return new Response(JSON.stringify({ theme: data?.theme || null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (req.method === 'POST') {
    const { theme } = await req.json();
    
    if (!theme || !['light', 'dark'].includes(theme)) {
      return new Response(JSON.stringify({ error: 'Invalid theme' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabase
      .from('theme_preferences')
      .upsert({
        ip_address: ip,
        theme,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'ip_address' });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});

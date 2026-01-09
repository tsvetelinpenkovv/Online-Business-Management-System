import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConnectixConfig {
  api_token: string;
  template_id: string;
  trigger_status: string;
  is_enabled: boolean;
  message_template: string;
  sandbox_mode: boolean;
}

interface SendMessageRequest {
  action?: 'test' | 'send';
  api_token?: string;
  sandbox_mode?: boolean;
  order_id?: number;
  phone?: string;
  customer_name?: string;
  tracking_number?: string;
  product_name?: string;
  total_price?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SendMessageRequest = await req.json();
    const { action, api_token, sandbox_mode, order_id, phone, customer_name, tracking_number, product_name, total_price } = body;

    console.log('Connectix request:', { action, order_id, phone: phone?.slice(0, 6) + '***' });

    // Test connection action
    if (action === 'test') {
      if (!api_token) {
        return new Response(
          JSON.stringify({ success: false, error: 'API token is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // In sandbox mode, just simulate success
      if (sandbox_mode) {
        console.log('Sandbox mode: Simulating successful connection test');
        return new Response(
          JSON.stringify({ success: true, message: 'Sandbox mode - connection simulated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Test actual connection to Connectix API
      try {
        const testResponse = await fetch('https://api.connectix.bg/v2/templates', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${api_token}`,
            'Content-Type': 'application/json',
          },
        });

        if (testResponse.ok) {
          return new Response(
            JSON.stringify({ success: true, message: 'Connection successful' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          const errorText = await testResponse.text();
          console.error('Connectix API error:', errorText);
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid API token or connection failed' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (fetchError) {
        console.error('Connectix fetch error:', fetchError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to connect to Connectix API' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Send message action
    if (action === 'send') {
      if (!phone) {
        return new Response(
          JSON.stringify({ success: false, error: 'Phone number is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get Connectix config from database
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: configData } = await supabase
        .from('api_settings')
        .select('setting_value')
        .eq('setting_key', 'connectix_config')
        .maybeSingle();

      if (!configData?.setting_value) {
        return new Response(
          JSON.stringify({ success: false, error: 'Connectix not configured' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const config: ConnectixConfig = JSON.parse(configData.setting_value);

      if (!config.is_enabled) {
        return new Response(
          JSON.stringify({ success: false, error: 'Connectix is disabled' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!config.api_token || !config.template_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Connectix API token or template ID missing' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Format phone number (ensure it starts with country code)
      let formattedPhone = phone.replace(/\s+/g, '').replace(/^\+/, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '359' + formattedPhone.slice(1);
      }

      // Prepare message parameters
      const messageParams: Record<string, string> = {
        customer_name: customer_name || 'Клиент',
        order_id: order_id?.toString() || '',
        tracking_number: tracking_number || 'Няма',
        product_name: product_name || '',
        total_price: total_price?.toFixed(2) || '0.00',
      };

      console.log('Sending message to:', formattedPhone.slice(0, 6) + '***');
      console.log('Template ID:', config.template_id);
      console.log('Parameters:', messageParams);

      // In sandbox mode, simulate success
      if (config.sandbox_mode) {
        console.log('Sandbox mode: Simulating message send');
        
        // Log the simulated send
        await supabase.from('api_settings').upsert({
          setting_key: `connectix_log_${Date.now()}`,
          setting_value: JSON.stringify({
            type: 'sandbox_send',
            phone: formattedPhone,
            order_id,
            params: messageParams,
            timestamp: new Date().toISOString(),
          }),
        }, { onConflict: 'setting_key' });

        return new Response(
          JSON.stringify({ success: true, message: 'Sandbox mode - message simulated', message_id: `sandbox_${Date.now()}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Send actual message via Connectix API
      try {
        const messageBody = {
          template: config.template_id,
          phone: formattedPhone,
          parameters: messageParams,
          contact: {
            firstName: customer_name?.split(' ')[0] || 'Клиент',
            lastName: customer_name?.split(' ').slice(1).join(' ') || '',
          },
        };

        const sendResponse = await fetch('https://api.connectix.bg/v2/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.api_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messageBody),
        });

        const responseData = await sendResponse.json();

        if (sendResponse.ok) {
          console.log('Message sent successfully:', responseData);
          return new Response(
            JSON.stringify({ success: true, message: 'Message sent', data: responseData }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          console.error('Connectix send error:', responseData);
          return new Response(
            JSON.stringify({ success: false, error: responseData.message || 'Failed to send message' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (sendError) {
        console.error('Error sending message:', sendError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to send message to Connectix' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in connectix-send function:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

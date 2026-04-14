import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const results: Record<string, unknown> = {};
    const alerts: Array<{ alert_type: string; source: string; title: string; message: string }> = [];

    // 1. Check DB connectivity
    try {
      const { error } = await supabase.from('order_statuses').select('id').limit(1);
      results.database = error ? 'error' : 'ok';
      if (error) {
        alerts.push({ alert_type: 'error', source: 'database', title: 'DB не отговаря', message: error.message });
      }
    } catch (e) {
      results.database = 'error';
      alerts.push({ alert_type: 'error', source: 'database', title: 'DB недостъпна', message: String(e) });
    }

    // 2. Check failed webhooks
    try {
      const { data: failedWh } = await supabase
        .from('outgoing_webhooks')
        .select('id, name, failure_count')
        .gt('failure_count', 3)
        .eq('is_enabled', true);

      results.failedWebhooks = failedWh?.length || 0;
      if (failedWh && failedWh.length > 0) {
        for (const wh of failedWh) {
          alerts.push({
            alert_type: 'warning',
            source: 'webhook',
            title: `Webhook "${wh.name}" — ${wh.failure_count} грешки`,
            message: `Webhook ID: ${wh.id} има повече от 3 последователни грешки`,
          });
        }
      }
    } catch {
      results.failedWebhooks = 'check_failed';
    }

    // 3. Check critical low stock
    try {
      const { data: outOfStock } = await supabase
        .from('inventory_products')
        .select('id, name, current_stock')
        .lte('current_stock', 0)
        .eq('is_active', true)
        .limit(10);

      results.outOfStockCount = outOfStock?.length || 0;
      if (outOfStock && outOfStock.length > 0) {
        alerts.push({
          alert_type: 'warning',
          source: 'inventory',
          title: `${outOfStock.length} продукта без наличност`,
          message: outOfStock.map(p => p.name).slice(0, 5).join(', '),
        });
      }
    } catch {
      results.outOfStockCount = 'check_failed';
    }

    // 4. Insert alerts
    if (alerts.length > 0) {
      await supabase.from('system_alerts').insert(alerts);
    }

    return new Response(
      JSON.stringify({ success: true, results, alertsCreated: alerts.length, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Health check error:', error);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

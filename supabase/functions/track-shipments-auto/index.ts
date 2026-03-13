import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Get all enabled tracking configs
    const { data: configs, error: configError } = await supabase
      .from('courier_tracking_config')
      .select('*, couriers(name, url_pattern)')
      .eq('is_enabled', true);

    if (configError) throw configError;
    if (!configs || configs.length === 0) {
      return new Response(JSON.stringify({ message: 'No tracking configs enabled', tracked: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. For each enabled courier, get active shipments
    let totalTracked = 0;
    let totalUpdated = 0;

    for (const config of configs) {
      // Get Econt API credentials
      const { data: apiSettings } = await supabase
        .from('courier_api_settings')
        .select('*')
        .eq('courier_id', config.courier_id)
        .eq('is_enabled', true)
        .single();

      if (!apiSettings) continue;

      // Get active shipments for this courier (not delivered, not cancelled)
      const { data: shipments, error: shipError } = await supabase
        .from('shipments')
        .select('id, waybill_number, order_id, status')
        .eq('courier_id', config.courier_id)
        .not('status', 'in', '("delivered","cancelled","returned")');

      if (shipError || !shipments || shipments.length === 0) continue;

      // Determine base URL based on courier name/settings
      const isTestMode = apiSettings.is_test_mode || false;
      const baseUrl = isTestMode
        ? 'https://demo.econt.com/ee/services'
        : 'https://ee.econt.com/ee/services';

      const authHeader = 'Basic ' + btoa(`${apiSettings.username}:${apiSettings.password}`);

      // Batch waybill numbers (Econt supports multiple)
      const waybillNumbers = shipments.map(s => s.waybill_number).filter(Boolean);
      if (waybillNumbers.length === 0) continue;

      try {
        const response = await fetch(
          `${baseUrl}/Shipments/ShipmentService.getShipmentStatuses.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': authHeader,
            },
            body: JSON.stringify({ shipmentNumbers: waybillNumbers }),
          }
        );

        const result = await response.json();
        if (!result?.shipmentStatuses) continue;

        totalTracked += waybillNumbers.length;

        for (const statusInfo of result.shipmentStatuses) {
          const shipment = shipments.find(s => s.waybill_number === statusInfo.shipmentNumber);
          if (!shipment) continue;

          // Get the latest event
          const events = statusInfo.shipmentStatusEvents || [];
          if (events.length === 0) continue;

          const latestEvent = events[events.length - 1];
          const eventName = latestEvent?.shipmentStatusEvent?.event?.name || '';

          // Map Econt status to internal status
          let newShipmentStatus: string | null = null;
          let newOrderStatus: string | null = null;

          // Check for delivered events
          if (
            eventName.includes('Доставена') ||
            eventName.includes('Получена') ||
            eventName.includes('delivered')
          ) {
            newShipmentStatus = 'delivered';
            newOrderStatus = config.delivered_status_name;
          }
          // Check for returned events
          else if (
            eventName.includes('Върната') ||
            eventName.includes('returned')
          ) {
            newShipmentStatus = 'returned';
            newOrderStatus = config.returned_status_name;
          }

          if (newShipmentStatus && newShipmentStatus !== shipment.status) {
            // Update shipment status
            await supabase
              .from('shipments')
              .update({ status: newShipmentStatus })
              .eq('id', shipment.id);

            // Update order status if linked
            if (shipment.order_id && newOrderStatus) {
              await supabase
                .from('orders')
                .update({ status: newOrderStatus })
                .eq('id', shipment.order_id);
            }

            totalUpdated++;
            console.log(
              `Shipment ${statusInfo.shipmentNumber}: ${shipment.status} → ${newShipmentStatus}, order ${shipment.order_id} → ${newOrderStatus}`
            );
          }
        }
      } catch (apiError) {
        console.error(`Error tracking courier ${config.courier_id}:`, apiError);
      }
    }

    return new Response(
      JSON.stringify({ message: 'Tracking complete', tracked: totalTracked, updated: totalUpdated }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Track shipments error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

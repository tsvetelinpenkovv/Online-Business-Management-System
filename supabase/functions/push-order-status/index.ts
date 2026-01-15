import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlatformConfig {
  store_url: string;
  api_key: string;
  api_secret: string;
  is_enabled: boolean;
}

// Map our statuses to platform statuses
const statusMaps: Record<string, Record<string, string>> = {
  woocommerce: {
    'Нова': 'pending',
    'В обработка': 'processing',
    'Потвърдена': 'processing',
    'Платена с карта': 'processing',
    'Изпратена': 'completed',
    'Доставена': 'completed',
    'Завършена': 'completed',
    'Отказана': 'cancelled',
    'Върната': 'refunded',
    'Анулирана': 'failed',
    'Неуспешна доставка': 'on-hold',
  },
  prestashop: {
    'Нова': '1',
    'В обработка': '3',
    'Потвърдена': '9',
    'Платена с карта': '2',
    'Изпратена': '4',
    'Доставена': '5',
    'Завършена': '11',
    'Отказана': '6',
    'Върната': '7',
    'Анулирана': '8',
    'Неуспешна доставка': '10',
  },
  shopify: {
    'Изпратена': 'fulfilled',
    'Доставена': 'fulfilled',
    'Завършена': 'fulfilled',
    'В обработка': 'unfulfilled',
    'Нова': 'unfulfilled',
    'Отказана': 'cancelled',
  },
  opencart: {
    'Нова': 'Pending',
    'В обработка': 'Processing',
    'Изпратена': 'Shipped',
    'Завършена': 'Complete',
    'Отказана': 'Canceled',
    'Върната': 'Refunded',
    'Анулирана': 'Failed',
  },
  magento: {
    'Нова': 'pending',
    'В обработка': 'processing',
    'Изпратена': 'complete',
    'Завършена': 'complete',
    'Отказана': 'canceled',
    'Анулирана': 'closed',
  },
};

// ================== WooCommerce ==================
async function pushToWooCommerce(config: PlatformConfig, orderCode: string, status: string, trackingNumber?: string): Promise<boolean> {
  const credentials = btoa(`${config.api_key}:${config.api_secret}`);

  try {
    // Extract WooCommerce order ID from code (WC-123)
    const orderId = orderCode.replace('WC-', '');

    const wcStatus = statusMaps.woocommerce[status] || 'processing';

    // Update order status
    const updateUrl = `${config.store_url}/wp-json/wc/v3/orders/${orderId}`;
    const updateData: any = { status: wcStatus };

    // Add tracking as order note if provided
    if (trackingNumber) {
      updateData.customer_note = `Товарителница: ${trackingNumber}`;
    }

    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!updateRes.ok) {
      console.error(`WooCommerce: Failed to update order ${orderId}`);
      return false;
    }

    // Add tracking note separately if provided
    if (trackingNumber) {
      const noteUrl = `${config.store_url}/wp-json/wc/v3/orders/${orderId}/notes`;
      await fetch(noteUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          note: `Товарителница: ${trackingNumber}`,
          customer_note: true,
        }),
      });
    }

    console.log(`WooCommerce: Updated order ${orderId} to status ${wcStatus}`);
    return true;
  } catch (error) {
    console.error('WooCommerce push error:', error);
    return false;
  }
}

// ================== PrestaShop ==================
async function pushToPrestaShop(config: PlatformConfig, orderCode: string, status: string, trackingNumber?: string): Promise<boolean> {
  const credentials = btoa(`${config.api_key}:`);

  try {
    // Extract PrestaShop order reference from code (PS-XXXX or PS-123)
    const orderRef = orderCode.replace('PS-', '');
    const psStatus = statusMaps.prestashop[status] || '3';

    // Search for order by reference
    const searchUrl = `${config.store_url}/api/orders?output_format=JSON&filter[reference]=${encodeURIComponent(orderRef)}`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'Authorization': `Basic ${credentials}` },
    });

    if (!searchRes.ok) {
      console.error('PrestaShop: Failed to search order');
      return false;
    }

    const data = await searchRes.json();
    if (!data.orders?.length) {
      // Try as order ID
      const orderId = parseInt(orderRef);
      if (isNaN(orderId)) {
        console.log(`PrestaShop: Order not found - ${orderRef}`);
        return false;
      }

      // Update using order ID
      const updateUrl = `${config.store_url}/api/orders/${orderId}`;
      const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order>
    <id>${orderId}</id>
    <current_state>${psStatus}</current_state>
    ${trackingNumber ? `<shipping_number>${trackingNumber}</shipping_number>` : ''}
  </order>
</prestashop>`;

      const updateRes = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/xml',
        },
        body: xmlBody,
      });

      if (!updateRes.ok) {
        console.error(`PrestaShop: Failed to update order ${orderId}`);
        return false;
      }

      console.log(`PrestaShop: Updated order ${orderId} to status ${psStatus}`);
      return true;
    }

    const orderId = data.orders[0].id;

    // Update order status
    const updateUrl = `${config.store_url}/api/orders/${orderId}`;
    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <order>
    <id>${orderId}</id>
    <current_state>${psStatus}</current_state>
    ${trackingNumber ? `<shipping_number>${trackingNumber}</shipping_number>` : ''}
  </order>
</prestashop>`;

    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/xml',
      },
      body: xmlBody,
    });

    if (!updateRes.ok) {
      console.error(`PrestaShop: Failed to update order ${orderId}`);
      return false;
    }

    console.log(`PrestaShop: Updated order ${orderId} to status ${psStatus}`);
    return true;
  } catch (error) {
    console.error('PrestaShop push error:', error);
    return false;
  }
}

// ================== Shopify ==================
async function pushToShopify(config: PlatformConfig, orderCode: string, status: string, trackingNumber?: string): Promise<boolean> {
  try {
    // Extract Shopify order number from code (SH-1001)
    const orderNumber = orderCode.replace('SH-', '');

    // Search for order
    const searchUrl = `${config.store_url}/admin/api/2024-01/orders.json?name=%23${orderNumber}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'X-Shopify-Access-Token': config.api_key,
        'Content-Type': 'application/json',
      },
    });

    if (!searchRes.ok) {
      console.error('Shopify: Failed to search order');
      return false;
    }

    const data = await searchRes.json();
    if (!data.orders?.length) {
      console.log(`Shopify: Order not found - ${orderNumber}`);
      return false;
    }

    const order = data.orders[0];
    const fulfillmentStatus = statusMaps.shopify[status];

    // If status indicates shipped/fulfilled, create fulfillment
    if (fulfillmentStatus === 'fulfilled') {
      // Get fulfillment orders
      const foUrl = `${config.store_url}/admin/api/2024-01/orders/${order.id}/fulfillment_orders.json`;
      const foRes = await fetch(foUrl, {
        headers: {
          'X-Shopify-Access-Token': config.api_key,
          'Content-Type': 'application/json',
        },
      });

      if (foRes.ok) {
        const foData = await foRes.json();
        const fulfillmentOrderId = foData.fulfillment_orders?.[0]?.id;

        if (fulfillmentOrderId) {
          // Create fulfillment
          const fulfillUrl = `${config.store_url}/admin/api/2024-01/fulfillments.json`;
          const fulfillData: any = {
            fulfillment: {
              line_items_by_fulfillment_order: [{
                fulfillment_order_id: fulfillmentOrderId,
              }],
              notify_customer: true,
            },
          };

          if (trackingNumber) {
            fulfillData.fulfillment.tracking_info = {
              number: trackingNumber,
            };
          }

          const fulfillRes = await fetch(fulfillUrl, {
            method: 'POST',
            headers: {
              'X-Shopify-Access-Token': config.api_key,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(fulfillData),
          });

          if (!fulfillRes.ok) {
            console.error('Shopify: Failed to create fulfillment');
            return false;
          }

          console.log(`Shopify: Created fulfillment for order ${order.id}`);
          return true;
        }
      }
    }

    // For cancellation
    if (fulfillmentStatus === 'cancelled') {
      const cancelUrl = `${config.store_url}/admin/api/2024-01/orders/${order.id}/cancel.json`;
      const cancelRes = await fetch(cancelUrl, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': config.api_key,
          'Content-Type': 'application/json',
        },
      });

      if (!cancelRes.ok) {
        console.error('Shopify: Failed to cancel order');
        return false;
      }

      console.log(`Shopify: Cancelled order ${order.id}`);
      return true;
    }

    console.log(`Shopify: Updated order ${order.id} - status ${status} not directly applicable`);
    return true;
  } catch (error) {
    console.error('Shopify push error:', error);
    return false;
  }
}

// ================== OpenCart ==================
async function pushToOpenCart(config: PlatformConfig, orderCode: string, status: string, trackingNumber?: string): Promise<boolean> {
  try {
    const orderId = orderCode.replace('OC-', '');
    const ocStatus = statusMaps.opencart[status] || 'Processing';

    const updateUrl = `${config.store_url}/index.php?route=api/order/history&order_id=${orderId}`;
    const updateRes = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'X-Oc-Restadmin-Id': config.api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_status: ocStatus,
        comment: trackingNumber ? `Товарителница: ${trackingNumber}` : '',
        notify: '1',
      }),
    });

    if (!updateRes.ok) {
      console.error(`OpenCart: Failed to update order ${orderId}`);
      return false;
    }

    console.log(`OpenCart: Updated order ${orderId} to status ${ocStatus}`);
    return true;
  } catch (error) {
    console.error('OpenCart push error:', error);
    return false;
  }
}

// ================== Magento ==================
async function pushToMagento(config: PlatformConfig, orderCode: string, status: string, trackingNumber?: string): Promise<boolean> {
  try {
    // Get admin token
    const tokenUrl = `${config.store_url}/rest/V1/integration/admin/token`;
    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: config.api_key,
        password: config.api_secret,
      }),
    });

    if (!tokenRes.ok) {
      console.error('Magento: Failed to get admin token');
      return false;
    }

    const token = await tokenRes.json();
    const authHeader = `Bearer ${token.replace(/"/g, '')}`;

    const incrementId = orderCode.replace('MG-', '');

    // Get order by increment ID
    const searchUrl = `${config.store_url}/rest/V1/orders?searchCriteria[filter_groups][0][filters][0][field]=increment_id&searchCriteria[filter_groups][0][filters][0][value]=${incrementId}`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'Authorization': authHeader },
    });

    if (!searchRes.ok) {
      console.error('Magento: Failed to search order');
      return false;
    }

    const data = await searchRes.json();
    if (!data.items?.length) {
      console.log(`Magento: Order not found - ${incrementId}`);
      return false;
    }

    const order = data.items[0];
    const magentoStatus = statusMaps.magento[status] || 'processing';

    // For shipped status, create shipment with tracking
    if (['Изпратена', 'Доставена', 'Завършена'].includes(status)) {
      const shipmentUrl = `${config.store_url}/rest/V1/order/${order.entity_id}/ship`;
      const shipmentData: any = {
        notify: true,
      };

      if (trackingNumber) {
        shipmentData.tracks = [{
          track_number: trackingNumber,
          title: 'Shipping',
          carrier_code: 'custom',
        }];
      }

      const shipmentRes = await fetch(shipmentUrl, {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shipmentData),
      });

      if (shipmentRes.ok) {
        console.log(`Magento: Created shipment for order ${order.entity_id}`);
        return true;
      }
    }

    // For cancellation
    if (status === 'Отказана' || status === 'Анулирана') {
      const cancelUrl = `${config.store_url}/rest/V1/orders/${order.entity_id}/cancel`;
      const cancelRes = await fetch(cancelUrl, {
        method: 'POST',
        headers: { 'Authorization': authHeader },
      });

      if (cancelRes.ok) {
        console.log(`Magento: Cancelled order ${order.entity_id}`);
        return true;
      }
    }

    // Add comment with status
    const commentUrl = `${config.store_url}/rest/V1/orders/${order.entity_id}/comments`;
    const commentRes = await fetch(commentUrl, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        statusHistory: {
          comment: trackingNumber ? `Товарителница: ${trackingNumber}` : `Статус: ${status}`,
          is_customer_notified: 1,
          status: magentoStatus,
        },
      }),
    });

    if (commentRes.ok) {
      console.log(`Magento: Added comment to order ${order.entity_id}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Magento push error:', error);
    return false;
  }
}

// ================== Main Handler ==================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Order status push request received');

    const body = await req.json();
    const { orderId, orderCode, status, trackingNumber } = body;

    if (!orderCode && !orderId) {
      return new Response(JSON.stringify({ error: 'Order ID or code required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!status) {
      return new Response(JSON.stringify({ error: 'Status required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get order code if only ID provided
    let code = orderCode;
    if (orderId && !orderCode) {
      const { data: order } = await supabase
        .from('orders')
        .select('code')
        .eq('id', orderId)
        .single();

      if (order) {
        code = order.code;
      }
    }

    if (!code) {
      return new Response(JSON.stringify({ error: 'Could not determine order code' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine platform from order code prefix
    const platformPrefix = code.split('-')[0];
    const platformMap: Record<string, string> = {
      'WC': 'woocommerce',
      'PS': 'prestashop',
      'SH': 'shopify',
      'OC': 'opencart',
      'MG': 'magento',
    };

    const platformName = platformMap[platformPrefix];
    if (!platformName) {
      return new Response(JSON.stringify({ success: true, message: 'Order not from external platform', synced: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get platform config
    const { data: platform } = await supabase
      .from('ecommerce_platforms')
      .select('*')
      .eq('name', platformName)
      .eq('is_enabled', true)
      .maybeSingle();

    if (!platform) {
      return new Response(JSON.stringify({ success: true, message: 'Platform not enabled', synced: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: configData } = await supabase
      .from('api_settings')
      .select('setting_value')
      .eq('setting_key', `${platformName}_config`)
      .maybeSingle();

    if (!configData?.setting_value) {
      return new Response(JSON.stringify({ error: 'Platform not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let config: PlatformConfig;
    try {
      config = JSON.parse(configData.setting_value);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid platform configuration' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!config.store_url || !config.api_key) {
      return new Response(JSON.stringify({ error: 'Platform API not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Pushing status "${status}" to ${platformName} for order ${code}`);

    let success = false;

    switch (platformName) {
      case 'woocommerce':
        success = await pushToWooCommerce(config, code, status, trackingNumber);
        break;
      case 'prestashop':
        success = await pushToPrestaShop(config, code, status, trackingNumber);
        break;
      case 'shopify':
        success = await pushToShopify(config, code, status, trackingNumber);
        break;
      case 'opencart':
        success = await pushToOpenCart(config, code, status, trackingNumber);
        break;
      case 'magento':
        success = await pushToMagento(config, code, status, trackingNumber);
        break;
    }

    return new Response(JSON.stringify({
      success,
      platform: platformName,
      orderCode: code,
      status,
      trackingNumber: trackingNumber || null,
      message: success
        ? `Статус "${status}" изпратен към ${platform.display_name}`
        : `Грешка при изпращане към ${platform.display_name}`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Order status push error:', error);
    return new Response(JSON.stringify({ error: errorMessage, success: false }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

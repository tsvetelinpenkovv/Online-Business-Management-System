import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-wc-webhook-signature, x-wc-webhook-topic',
};

interface WooCommerceOrder {
  id: number;
  order_key: string;
  status: string;
  date_created: string;
  total: string;
  billing: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  shipping: {
    first_name: string;
    last_name: string;
    address_1: string;
    address_2: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  line_items: Array<{
    id: number;
    name: string;
    sku: string;
    quantity: number;
    price: number;
  }>;
  meta_data?: Array<{
    key: string;
    value: string;
  }>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  customer_note?: string;
  _wc_order_attribution_utm_source?: string;
  _wc_order_attribution_referrer?: string;
}

// Verify WooCommerce webhook signature
async function verifyWooCommerceSignature(bodyText: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(bodyText));
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
    return signature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Detect marketing source from UTM data
function detectMarketingSource(order: WooCommerceOrder): string | null {
  const metaData = order.meta_data || [];
  
  const utmSourceKeys = [
    '_wc_order_attribution_utm_source',
    'utm_source',
    '_utm_source',
    'wc_order_attribution_utm_source',
    'referer_source',
    '_referer_source'
  ];
  
  const referrerKeys = [
    '_wc_order_attribution_referrer',
    'referrer',
    '_referrer',
    'referer'
  ];
  
  let utmSource = order.utm_source || order._wc_order_attribution_utm_source || '';
  let referrer = order._wc_order_attribution_referrer || '';
  
  for (const meta of metaData) {
    if (utmSourceKeys.includes(meta.key)) {
      utmSource = meta.value;
    }
    if (referrerKeys.includes(meta.key)) {
      referrer = meta.value;
    }
  }
  
  const source = (utmSource || referrer).toLowerCase();
  
  if (source.includes('facebook') || source.includes('fb') || source.includes('instagram') || source.includes('ig') || source.includes('meta')) {
    return 'facebook';
  }
  
  if (source.includes('google') || source.includes('gclid') || source.includes('adwords') || source.includes('ppc') || source.includes('cpc')) {
    return 'google';
  }
  
  return null;
}

function mapWooStatus(wcStatus: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Нова',
    'processing': 'В обработка',
    'on-hold': 'В обработка',
    'completed': 'Завършена',
    'cancelled': 'Отказана',
    'refunded': 'Върната',
    'failed': 'Анулирана',
  };
  return statusMap[wcStatus] || 'Нова';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('WooCommerce webhook received');
    
    // Get webhook signature and secret
    const signature = req.headers.get('x-wc-webhook-signature');
    const webhookSecret = Deno.env.get('WC_WEBHOOK_SECRET');
    
    // Read body as text first for signature verification
    const bodyText = await req.text();
    
    // Webhook secret is mandatory - reject if not configured
    if (!webhookSecret) {
      console.error('WC_WEBHOOK_SECRET not configured - webhook authentication disabled');
      return new Response(JSON.stringify({ error: 'Webhook authentication not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify signature
    if (!signature) {
      console.error('Missing webhook signature');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const isValid = await verifyWooCommerceSignature(bodyText, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('Webhook signature verified');

    const topic = req.headers.get('x-wc-webhook-topic');
    console.log('Webhook topic:', topic);

    if (!topic || (!topic.includes('order.created') && !topic.includes('order.updated'))) {
      console.log('Ignoring non-order webhook:', topic);
      return new Response(JSON.stringify({ success: true, message: 'Ignored non-order webhook' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = JSON.parse(bodyText);
    const order = body as WooCommerceOrder;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const shipping = order.shipping;
    const addressParts = [
      shipping.address_1,
      shipping.address_2,
      shipping.city,
      shipping.state,
      shipping.postcode,
      shipping.country,
    ].filter(Boolean);
    const deliveryAddress = addressParts.join(', ') || null;

    const customerName = `${order.billing.first_name} ${order.billing.last_name}`.trim() || 'Без име';
    const productNames = order.line_items.map(item => item.name).join(', ');
    const catalogNumbers = order.line_items.map(item => item.sku).filter(Boolean).join(', ');
    const totalQuantity = order.line_items.reduce((sum, item) => sum + item.quantity, 0);

    const marketingSource = detectMarketingSource(order);
    const orderSource = marketingSource || 'woocommerce';
    console.log('Detected marketing source:', marketingSource, '-> Using source:', orderSource);

    const orderCode = `WC-${order.id}`;
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('code', orderCode)
      .maybeSingle();

    const orderData = {
      code: orderCode,
      customer_name: customerName,
      customer_email: order.billing.email || null,
      phone: order.billing.phone || 'Няма',
      total_price: parseFloat(order.total) || 0,
      product_name: productNames || 'Без продукт',
      catalog_number: catalogNumbers || null,
      quantity: totalQuantity || 1,
      delivery_address: deliveryAddress,
      status: mapWooStatus(order.status),
      source: orderSource,
      is_correct: true,
      comment: `WooCommerce Order #${order.id}${marketingSource ? ` (via ${marketingSource})` : ''}`,
    };

    if (existingOrder) {
      console.log('Updating existing order:', existingOrder.id);
      const { error } = await supabase
        .from('orders')
        .update(orderData)
        .eq('id', existingOrder.id);

      if (error) {
        console.error('Error updating order:', error);
        throw error;
      }
      console.log('Order updated successfully');
    } else {
      console.log('Creating new order');
      const { error } = await supabase
        .from('orders')
        .insert(orderData);

      if (error) {
        console.error('Error creating order:', error);
        throw error;
      }
      console.log('Order created successfully');
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-shopify-hmac-sha256, x-shopify-topic, x-shopify-shop-domain',
};

interface ShopifyOrder {
  id: number;
  order_number: number;
  name: string;
  email: string;
  phone: string;
  total_price: string;
  financial_status: string;
  fulfillment_status: string | null;
  created_at: string;
  customer: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  billing_address: {
    first_name: string;
    last_name: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    province: string;
    zip: string;
    country: string;
  };
  shipping_address: {
    first_name: string;
    last_name: string;
    address1: string;
    address2: string;
    city: string;
    province: string;
    zip: string;
    country: string;
  };
  line_items: Array<{
    id: number;
    title: string;
    sku: string;
    quantity: number;
    price: string;
  }>;
  landing_site?: string;
  referring_site?: string;
  source_name?: string;
  note_attributes?: Array<{
    name: string;
    value: string;
  }>;
  buyer_accepts_marketing?: boolean;
  source_identifier?: string;
  source_url?: string;
}

// Verify Shopify webhook signature
async function verifyShopifySignature(bodyText: string, hmac: string, secret: string): Promise<boolean> {
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
    const expectedHmac = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)));
    return hmac === expectedHmac;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

function detectMarketingSource(order: ShopifyOrder): string | null {
  let utmSource = order.source_name || '';
  const referringSite = order.referring_site || '';
  const landingSite = order.landing_site || '';
  
  if (order.note_attributes) {
    for (const attr of order.note_attributes) {
      if (attr.name.toLowerCase() === 'utm_source' || attr.name.toLowerCase() === 'source') {
        utmSource = attr.value || utmSource;
      }
    }
  }
  
  if (landingSite) {
    try {
      const url = new URL(landingSite.startsWith('http') ? landingSite : `https://example.com${landingSite}`);
      const urlUtmSource = url.searchParams.get('utm_source');
      if (urlUtmSource) {
        utmSource = urlUtmSource;
      }
    } catch {
      // Invalid URL, continue with other checks
    }
  }
  
  const allSources = `${utmSource} ${referringSite} ${landingSite}`.toLowerCase();
  
  if (allSources.includes('facebook') || allSources.includes('fb.') || allSources.includes('instagram') || allSources.includes('ig.') || allSources.includes('meta')) {
    return 'facebook';
  }
  
  if (allSources.includes('google') || allSources.includes('gclid') || allSources.includes('adwords') || allSources.includes('googleads')) {
    return 'google';
  }
  
  return null;
}

function mapShopifyStatus(financialStatus: string, fulfillmentStatus: string | null): string {
  if (fulfillmentStatus === 'fulfilled') return 'Завършена';
  if (fulfillmentStatus === 'partial') return 'В обработка';
  if (financialStatus === 'refunded') return 'Върната';
  if (financialStatus === 'voided') return 'Анулирана';
  if (financialStatus === 'pending') return 'Нова';
  if (financialStatus === 'paid') return 'В обработка';
  return 'Нова';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Shopify webhook received');
    
    // Get webhook signature and secret
    const hmac = req.headers.get('x-shopify-hmac-sha256');
    const webhookSecret = Deno.env.get('SHOPIFY_WEBHOOK_SECRET');
    
    // Read body as text first for signature verification
    const bodyText = await req.text();
    
    // Webhook secret is mandatory - reject if not configured
    if (!webhookSecret) {
      console.error('SHOPIFY_WEBHOOK_SECRET not configured - webhook authentication disabled');
      return new Response(JSON.stringify({ error: 'Webhook authentication not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify signature
    if (!hmac) {
      console.error('Missing webhook signature');
      return new Response(JSON.stringify({ error: 'Missing signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const isValid = await verifyShopifySignature(bodyText, hmac, webhookSecret);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('Webhook signature verified');

    const topic = req.headers.get('x-shopify-topic');
    console.log('Webhook topic:', topic);

    if (!topic || (!topic.includes('orders/create') && !topic.includes('orders/updated'))) {
      console.log('Ignoring non-order webhook:', topic);
      return new Response(JSON.stringify({ success: true, message: 'Ignored non-order webhook' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = JSON.parse(bodyText);
    const order = body as ShopifyOrder;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const shipping = order.shipping_address || order.billing_address;
    const addressParts = [
      shipping?.address1,
      shipping?.address2,
      shipping?.city,
      shipping?.province,
      shipping?.zip,
      shipping?.country,
    ].filter(Boolean);
    const deliveryAddress = addressParts.join(', ') || null;

    const customerName = order.customer 
      ? `${order.customer.first_name} ${order.customer.last_name}`.trim()
      : `${order.billing_address?.first_name || ''} ${order.billing_address?.last_name || ''}`.trim() || 'Без име';

    const productNames = order.line_items?.map(item => item.title).join(', ') || 'Без продукт';
    const catalogNumbers = order.line_items?.map(item => item.sku).filter(Boolean).join(', ') || null;
    const totalQuantity = order.line_items?.reduce((sum, item) => sum + item.quantity, 0) || 1;

    const marketingSource = detectMarketingSource(order);
    const orderSource = marketingSource || 'shopify';
    console.log('Detected marketing source:', marketingSource, '-> Using source:', orderSource);

    const orderCode = `SH-${order.order_number || order.id}`;
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('code', orderCode)
      .maybeSingle();

    const orderData = {
      code: orderCode,
      customer_name: customerName || 'Без име',
      customer_email: order.email || order.customer?.email || null,
      phone: order.phone || order.customer?.phone || order.billing_address?.phone || 'Няма',
      total_price: parseFloat(order.total_price) || 0,
      product_name: productNames,
      catalog_number: catalogNumbers,
      quantity: totalQuantity,
      delivery_address: deliveryAddress,
      status: mapShopifyStatus(order.financial_status, order.fulfillment_status),
      source: orderSource,
      is_correct: true,
      comment: `Shopify Order ${order.name || '#' + order.order_number}${marketingSource ? ` (via ${marketingSource})` : ''}`,
    };

    if (existingOrder) {
      console.log('Updating existing order:', existingOrder.id);
      const { error } = await supabase
        .from('orders')
        .update(orderData)
        .eq('id', existingOrder.id);

      if (error) throw error;
      console.log('Order updated successfully');
    } else {
      console.log('Creating new order');
      const { error } = await supabase
        .from('orders')
        .insert(orderData);

      if (error) throw error;
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

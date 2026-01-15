import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-opencart-signature',
};

interface OpenCartOrder {
  order_id: number;
  invoice_no: string;
  invoice_prefix: string;
  store_name: string;
  firstname: string;
  lastname: string;
  email: string;
  telephone: string;
  total: string;
  order_status: string;
  date_added: string;
  shipping_address_1: string;
  shipping_address_2: string;
  shipping_city: string;
  shipping_postcode: string;
  shipping_country: string;
  products: Array<{
    product_id: number;
    name: string;
    model: string;
    quantity: number;
    price: string;
  }>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  tracking?: {
    source?: string;
    medium?: string;
    campaign?: string;
    referrer?: string;
  };
  custom_field?: Record<string, string>;
  affiliate_id?: number;
  affiliate_name?: string;
  marketing_id?: number;
  marketing_tracking?: string;
}

// Verify OpenCart webhook signature
async function verifyOpenCartSignature(bodyText: string, signature: string, secret: string): Promise<boolean> {
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

function detectMarketingSource(order: OpenCartOrder): string | null {
  let utmSource = order.utm_source || '';
  
  if (order.tracking) {
    utmSource = order.tracking.source || utmSource;
  }
  
  if (order.custom_field) {
    utmSource = order.custom_field.utm_source || order.custom_field.source || utmSource;
  }
  
  if (order.marketing_tracking) {
    utmSource = order.marketing_tracking || utmSource;
  }
  
  const source = utmSource.toLowerCase();
  
  if (source.includes('facebook') || source.includes('fb') || source.includes('instagram') || source.includes('ig') || source.includes('meta')) {
    return 'facebook';
  }
  
  if (source.includes('google') || source.includes('gclid') || source.includes('adwords') || source.includes('ppc') || source.includes('cpc')) {
    return 'google';
  }
  
  return null;
}

function mapOpenCartStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'Pending': 'Нова',
    'Processing': 'В обработка',
    'Shipped': 'Изпратена',
    'Complete': 'Завършена',
    'Canceled': 'Отказана',
    'Refunded': 'Върната',
    'Failed': 'Анулирана',
  };
  return statusMap[status] || 'Нова';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('OpenCart webhook received');
    
    // Get webhook signature and secret
    const signature = req.headers.get('x-opencart-signature');
    const webhookSecret = Deno.env.get('OPENCART_WEBHOOK_SECRET');
    
    // Read body as text first for signature verification
    const bodyText = await req.text();
    
    // Webhook secret is mandatory - reject if not configured
    if (!webhookSecret) {
      console.error('OPENCART_WEBHOOK_SECRET not configured - webhook authentication disabled');
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
    
    const isValid = await verifyOpenCartSignature(bodyText, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('Webhook signature verified');

    const body = JSON.parse(bodyText);
    const order = body as OpenCartOrder;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const addressParts = [
      order.shipping_address_1,
      order.shipping_address_2,
      order.shipping_city,
      order.shipping_postcode,
      order.shipping_country,
    ].filter(Boolean);
    const deliveryAddress = addressParts.join(', ') || null;

    const customerName = `${order.firstname} ${order.lastname}`.trim() || 'Без име';
    const productNames = order.products?.map(item => item.name).join(', ') || 'Без продукт';
    const catalogNumbers = order.products?.map(item => item.model).filter(Boolean).join(', ') || null;
    const totalQuantity = order.products?.reduce((sum, item) => sum + item.quantity, 0) || 1;

    const marketingSource = detectMarketingSource(order);
    const orderSource = marketingSource || 'opencart';
    console.log('Detected marketing source:', marketingSource, '-> Using source:', orderSource);

    const orderCode = `OC-${order.order_id}`;
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('code', orderCode)
      .maybeSingle();

    const orderData = {
      code: orderCode,
      customer_name: customerName,
      customer_email: order.email || null,
      phone: order.telephone || 'Няма',
      total_price: parseFloat(order.total) || 0,
      product_name: productNames,
      catalog_number: catalogNumbers,
      quantity: totalQuantity,
      delivery_address: deliveryAddress,
      status: mapOpenCartStatus(order.order_status),
      source: orderSource,
      is_correct: true,
      comment: `OpenCart Order #${order.order_id}${marketingSource ? ` (via ${marketingSource})` : ''}`,
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

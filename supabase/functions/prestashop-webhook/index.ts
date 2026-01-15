import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-prestashop-signature',
};

interface PrestaShopOrder {
  id: number;
  reference: string;
  current_state: number;
  date_add: string;
  total_paid: string;
  customer: {
    firstname: string;
    lastname: string;
    email: string;
  };
  address_delivery: {
    firstname: string;
    lastname: string;
    phone: string;
    phone_mobile: string;
    address1: string;
    address2: string;
    city: string;
    postcode: string;
    country: string;
  };
  order_rows: Array<{
    product_id: number;
    product_name: string;
    product_reference: string;
    product_quantity: number;
    unit_price_tax_incl: string;
  }>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  connection?: {
    http_referer?: string;
    id_referer?: number;
  };
  custom_fields?: Record<string, string>;
  marketing?: {
    source?: string;
    medium?: string;
    campaign?: string;
    referrer?: string;
  };
}

// Verify PrestaShop webhook signature
async function verifyPrestaShopSignature(bodyText: string, signature: string, secret: string): Promise<boolean> {
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

function detectMarketingSource(order: PrestaShopOrder): string | null {
  let utmSource = order.utm_source || '';
  
  if (order.marketing) {
    utmSource = order.marketing.source || utmSource;
  }
  
  if (order.custom_fields) {
    utmSource = order.custom_fields.utm_source || order.custom_fields.source || utmSource;
  }
  
  let referrer = '';
  if (order.connection) {
    referrer = order.connection.http_referer || '';
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

function mapPrestaShopStatus(stateId: number): string {
  const statusMap: Record<number, string> = {
    1: 'Нова',
    2: 'Платена с карта',
    3: 'В обработка',
    4: 'Изпратена',
    5: 'Доставена',
    6: 'Отказана',
    7: 'Върната',
    8: 'Анулирана',
    9: 'Потвърдена',
    10: 'Неуспешна доставка',
    11: 'Завършена',
  };
  return statusMap[stateId] || 'Нова';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('PrestaShop webhook received');
    
    // Get webhook signature and secret
    const signature = req.headers.get('x-prestashop-signature');
    const webhookSecret = Deno.env.get('PRESTASHOP_WEBHOOK_SECRET');
    
    // Read body as text first for signature verification
    const bodyText = await req.text();
    
    // Webhook secret is mandatory - reject if not configured
    if (!webhookSecret) {
      console.error('PRESTASHOP_WEBHOOK_SECRET not configured - webhook authentication disabled');
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
    
    const isValid = await verifyPrestaShopSignature(bodyText, signature, webhookSecret);
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.log('Webhook signature verified');

    const body = JSON.parse(bodyText);
    const eventType = body.event || body.type || 'order';
    console.log('Event type:', eventType);

    if (!eventType.includes('order')) {
      console.log('Ignoring non-order webhook:', eventType);
      return new Response(JSON.stringify({ success: true, message: 'Ignored non-order webhook' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const order = body.order || body as PrestaShopOrder;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const address = order.address_delivery || {};
    const addressParts = [
      address.address1,
      address.address2,
      address.city,
      address.postcode,
      address.country,
    ].filter(Boolean);
    const deliveryAddress = addressParts.join(', ') || null;

    const customer = order.customer || {};
    const customerName = `${customer.firstname || ''} ${customer.lastname || ''}`.trim() || 
                         `${address.firstname || ''} ${address.lastname || ''}`.trim() || 'Без име';

    const phone = address.phone_mobile || address.phone || 'Няма';

    const orderRows: Array<{product_name: string; product_reference: string; product_quantity: number}> = order.order_rows || [];
    const productNames = orderRows.map((item) => item.product_name).join(', ');
    const catalogNumbers = orderRows.map((item) => item.product_reference).filter(Boolean).join(', ');
    const totalQuantity = orderRows.reduce((sum: number, item) => sum + (item.product_quantity || 1), 0);

    const marketingSource = detectMarketingSource(order);
    const orderSource = marketingSource || 'prestashop';
    console.log('Detected marketing source:', marketingSource, '-> Using source:', orderSource);

    const orderCode = `PS-${order.reference || order.id}`;
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('code', orderCode)
      .maybeSingle();

    const orderData = {
      code: orderCode,
      customer_name: customerName,
      customer_email: customer.email || null,
      phone: phone,
      total_price: parseFloat(order.total_paid) || 0,
      product_name: productNames || 'Без продукт',
      catalog_number: catalogNumbers || null,
      quantity: totalQuantity || 1,
      delivery_address: deliveryAddress,
      status: mapPrestaShopStatus(order.current_state || 1),
      source: orderSource,
      is_correct: true,
      comment: `PrestaShop Order #${order.reference || order.id}${marketingSource ? ` (via ${marketingSource})` : ''}`,
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

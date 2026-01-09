import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-magento-signature',
};

interface MagentoOrder {
  entity_id: number;
  increment_id: string;
  state: string;
  status: string;
  grand_total: number;
  created_at: string;
  customer_email: string;
  customer_firstname: string;
  customer_lastname: string;
  billing_address: {
    firstname: string;
    lastname: string;
    telephone: string;
    street: string[];
    city: string;
    postcode: string;
    country_id: string;
  };
  extension_attributes?: {
    shipping_assignments?: Array<{
      shipping: {
        address: {
          street: string[];
          city: string;
          postcode: string;
          country_id: string;
        };
      };
    }>;
    // UTM tracking from Magento extensions
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    marketing_source?: string;
    referrer?: string;
  };
  items: Array<{
    item_id: number;
    name: string;
    sku: string;
    qty_ordered: number;
    price: number;
  }>;
  // Direct UTM fields
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  // Custom attributes array
  custom_attributes?: Array<{
    attribute_code: string;
    value: string;
  }>;
}

// Detect marketing source from UTM data
function detectMarketingSource(order: MagentoOrder): string | null {
  // Check direct UTM fields
  let utmSource = order.utm_source || '';
  
  // Check extension attributes (Magento 2 style)
  if (order.extension_attributes) {
    utmSource = order.extension_attributes.utm_source || 
                order.extension_attributes.marketing_source || 
                utmSource;
  }
  
  // Check custom attributes
  if (order.custom_attributes) {
    for (const attr of order.custom_attributes) {
      if (attr.attribute_code === 'utm_source' || attr.attribute_code === 'marketing_source') {
        utmSource = attr.value || utmSource;
      }
    }
  }
  
  // Normalize and detect source
  const source = utmSource.toLowerCase();
  
  if (source.includes('facebook') || source.includes('fb') || source.includes('instagram') || source.includes('ig') || source.includes('meta')) {
    return 'facebook';
  }
  
  if (source.includes('google') || source.includes('gclid') || source.includes('adwords') || source.includes('ppc') || source.includes('cpc')) {
    return 'google';
  }
  
  // Return null to use default platform source
  return null;
}

function mapMagentoStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'Нова',
    'pending_payment': 'Нова',
    'processing': 'В обработка',
    'holded': 'В обработка',
    'complete': 'Завършена',
    'closed': 'Завършена',
    'canceled': 'Отказана',
    'fraud': 'Анулирана',
  };
  return statusMap[status] || 'Нова';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Magento webhook received');
    console.log('Headers:', Object.fromEntries(req.headers.entries()));

    const body = await req.json();
    console.log('Webhook body:', JSON.stringify(body, null, 2));

    const order = body as MagentoOrder;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get shipping address
    const shippingAssignment = order.extension_attributes?.shipping_assignments?.[0];
    const shippingAddress = shippingAssignment?.shipping?.address || order.billing_address;
    
    const addressParts = [
      ...(shippingAddress?.street || []),
      shippingAddress?.city,
      shippingAddress?.postcode,
      shippingAddress?.country_id,
    ].filter(Boolean);
    const deliveryAddress = addressParts.join(', ') || null;

    const customerName = `${order.customer_firstname || order.billing_address?.firstname || ''} ${order.customer_lastname || order.billing_address?.lastname || ''}`.trim() || 'Без име';
    const productNames = order.items?.map(item => item.name).join(', ') || 'Без продукт';
    const catalogNumbers = order.items?.map(item => item.sku).filter(Boolean).join(', ') || null;
    const totalQuantity = order.items?.reduce((sum, item) => sum + (item.qty_ordered || 0), 0) || 1;

    // Detect marketing source from UTM data
    const marketingSource = detectMarketingSource(order);
    const orderSource = marketingSource || 'magento';
    console.log('Detected marketing source:', marketingSource, '-> Using source:', orderSource);

    const orderCode = `MG-${order.increment_id || order.entity_id}`;
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('code', orderCode)
      .maybeSingle();

    const orderData = {
      code: orderCode,
      customer_name: customerName,
      customer_email: order.customer_email || null,
      phone: order.billing_address?.telephone || 'Няма',
      total_price: order.grand_total || 0,
      product_name: productNames,
      catalog_number: catalogNumbers,
      quantity: totalQuantity,
      delivery_address: deliveryAddress,
      status: mapMagentoStatus(order.status),
      source: orderSource,
      is_correct: true,
      comment: `Magento Order #${order.increment_id || order.entity_id}${marketingSource ? ` (via ${marketingSource})` : ''}`,
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

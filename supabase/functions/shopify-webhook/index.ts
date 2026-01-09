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
    console.log('Headers:', Object.fromEntries(req.headers.entries()));

    const topic = req.headers.get('x-shopify-topic');
    console.log('Webhook topic:', topic);

    // Only process order events
    if (!topic || (!topic.includes('orders/create') && !topic.includes('orders/updated'))) {
      console.log('Ignoring non-order webhook:', topic);
      return new Response(JSON.stringify({ success: true, message: 'Ignored non-order webhook' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    console.log('Webhook body:', JSON.stringify(body, null, 2));

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

    const orderCode = `SH-${order.order_number || order.id}`;
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('code', orderCode)
      .maybeSingle();

    const orderData = {
      code: orderCode,
      customer_name: customerName,
      customer_email: order.email || order.customer?.email || null,
      phone: order.phone || order.customer?.phone || order.billing_address?.phone || 'Няма',
      total_price: parseFloat(order.total_price) || 0,
      product_name: productNames,
      catalog_number: catalogNumbers,
      quantity: totalQuantity,
      delivery_address: deliveryAddress,
      status: mapShopifyStatus(order.financial_status, order.fulfillment_status),
      source: 'shopify',
      is_correct: true,
      comment: `Shopify Order ${order.name || '#' + order.order_number}`,
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

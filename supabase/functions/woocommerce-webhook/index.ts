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
}

// Map WooCommerce status to our status
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('WooCommerce webhook received');
    console.log('Headers:', Object.fromEntries(req.headers.entries()));

    const topic = req.headers.get('x-wc-webhook-topic');
    console.log('Webhook topic:', topic);

    // Only process order.created and order.updated events
    if (!topic || (!topic.includes('order.created') && !topic.includes('order.updated'))) {
      console.log('Ignoring non-order webhook:', topic);
      return new Response(JSON.stringify({ success: true, message: 'Ignored non-order webhook' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    console.log('Webhook body:', JSON.stringify(body, null, 2));

    const order = body as WooCommerceOrder;

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build full delivery address
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

    // Build customer name
    const customerName = `${order.billing.first_name} ${order.billing.last_name}`.trim() || 'Без име';

    // Build product info from line items
    const productNames = order.line_items.map(item => item.name).join(', ');
    const catalogNumbers = order.line_items.map(item => item.sku).filter(Boolean).join(', ');
    const totalQuantity = order.line_items.reduce((sum, item) => sum + item.quantity, 0);

    // Check if order already exists (by WooCommerce order ID as code)
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
      source: 'woocommerce',
      is_correct: true,
      comment: `WooCommerce Order #${order.id}`,
    };

    if (existingOrder) {
      // Update existing order
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
      // Create new order
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

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
}

// Map PrestaShop order state to our status
function mapPrestaShopStatus(stateId: number): string {
  // PrestaShop default states:
  // 1 = Awaiting check payment, 2 = Payment accepted, 3 = Processing in progress
  // 4 = Shipped, 5 = Delivered, 6 = Canceled, 7 = Refunded
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('PrestaShop webhook received');
    console.log('Headers:', Object.fromEntries(req.headers.entries()));

    const body = await req.json();
    console.log('Webhook body:', JSON.stringify(body, null, 2));

    // PrestaShop can send different event types
    const eventType = body.event || body.type || 'order';
    console.log('Event type:', eventType);

    // Check if this is an order event
    if (!eventType.includes('order')) {
      console.log('Ignoring non-order webhook:', eventType);
      return new Response(JSON.stringify({ success: true, message: 'Ignored non-order webhook' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const order = body.order || body as PrestaShopOrder;

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build full delivery address
    const address = order.address_delivery || {};
    const addressParts = [
      address.address1,
      address.address2,
      address.city,
      address.postcode,
      address.country,
    ].filter(Boolean);
    const deliveryAddress = addressParts.join(', ') || null;

    // Build customer name
    const customer = order.customer || {};
    const customerName = `${customer.firstname || ''} ${customer.lastname || ''}`.trim() || 
                         `${address.firstname || ''} ${address.lastname || ''}`.trim() || 'Без име';

    // Build phone number
    const phone = address.phone_mobile || address.phone || 'Няма';

    // Build product info from order rows
    const orderRows: Array<{product_name: string; product_reference: string; product_quantity: number}> = order.order_rows || [];
    const productNames = orderRows.map((item) => item.product_name).join(', ');
    const catalogNumbers = orderRows.map((item) => item.product_reference).filter(Boolean).join(', ');
    const totalQuantity = orderRows.reduce((sum: number, item) => sum + (item.product_quantity || 1), 0);

    // Check if order already exists (by PrestaShop reference as code)
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
      source: 'prestashop',
      is_correct: true,
      comment: `PrestaShop Order #${order.reference || order.id}`,
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

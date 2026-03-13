import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate API key
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Missing x-api-key header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check API key against stored secret
    const { data: apiSetting } = await supabase
      .from("api_settings")
      .select("setting_value")
      .eq("setting_key", "custom_api_config")
      .maybeSingle();

    if (!apiSetting?.setting_value) {
      return new Response(JSON.stringify({ error: "Custom API not configured" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const config = JSON.parse(apiSetting.setting_value);
    if (config.webhook_secret !== apiKey) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // Validate required fields
    const { customer_name, phone, product_name, total_price, quantity } = body;
    if (!customer_name || !phone || !product_name || total_price === undefined) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          required: ["customer_name", "phone", "product_name", "total_price"],
          optional: [
            "quantity",
            "customer_email",
            "delivery_address",
            "comment",
            "payment_method",
            "catalog_number",
            "currency",
            "currency_symbol",
            "items",
          ],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate order code
    const code = `CUST-${Date.now().toString(36).toUpperCase()}`;

    // Get default status
    const { data: defaultStatus } = await supabase
      .from("order_statuses")
      .select("name")
      .eq("is_default", true)
      .maybeSingle();

    const status = defaultStatus?.name || "Нова";

    // Insert order
    const { data: order, error: orderError } = await supabase.from("orders").insert({
      code,
      customer_name,
      phone,
      product_name,
      total_price: Number(total_price),
      quantity: quantity || 1,
      status,
      source: "custom_api",
      customer_email: body.customer_email || null,
      delivery_address: body.delivery_address || null,
      comment: body.comment || null,
      payment_method: body.payment_method || "cod",
      catalog_number: body.catalog_number || null,
      currency: body.currency || "BGN",
      currency_symbol: body.currency_symbol || "лв.",
      payment_status: "unpaid",
    }).select().single();

    if (orderError) {
      console.error("Order insert error:", orderError);
      return new Response(JSON.stringify({ error: "Failed to create order", details: orderError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert order items if provided
    if (body.items && Array.isArray(body.items)) {
      const orderItems = body.items.map((item: any) => ({
        order_id: order.id,
        product_name: item.product_name || product_name,
        quantity: item.quantity || 1,
        unit_price: item.unit_price || 0,
        total_price: (item.quantity || 1) * (item.unit_price || 0),
        catalog_number: item.catalog_number || null,
      }));

      await supabase.from("order_items").insert(orderItems);
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id: order.id,
        order_code: order.code,
      }),
      {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Custom webhook error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

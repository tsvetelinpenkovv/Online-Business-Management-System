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

interface SyncResult {
  synced: number;
  errors: number;
}

// ================== WooCommerce ==================
async function syncToWooCommerce(config: PlatformConfig, sku: string, productName: string | undefined, price: number): Promise<boolean> {
  const credentials = btoa(`${config.api_key}:${config.api_secret}`);

  try {
    // Search by SKU first
    let productId: number | null = null;

    const skuSearchUrl = `${config.store_url}/wp-json/wc/v3/products?sku=${encodeURIComponent(sku)}`;
    const skuRes = await fetch(skuSearchUrl, {
      headers: { 'Authorization': `Basic ${credentials}` },
    });

    if (skuRes.ok) {
      const products = await skuRes.json();
      if (products.length > 0) {
        productId = products[0].id;
      }
    }

    // Search by name if no SKU match
    if (!productId && productName) {
      const nameSearchUrl = `${config.store_url}/wp-json/wc/v3/products?search=${encodeURIComponent(productName)}`;
      const nameRes = await fetch(nameSearchUrl, {
        headers: { 'Authorization': `Basic ${credentials}` },
      });

      if (nameRes.ok) {
        const products = await nameRes.json();
        const exactMatch = products.find((p: any) => p.name.toLowerCase() === productName.toLowerCase());
        if (exactMatch) {
          productId = exactMatch.id;
        }
      }
    }

    if (!productId) {
      console.log(`WooCommerce: Product not found - SKU: ${sku}, Name: ${productName}`);
      return false;
    }

    // Update price
    const updateUrl = `${config.store_url}/wp-json/wc/v3/products/${productId}`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        regular_price: price.toString(),
        price: price.toString(),
      }),
    });

    if (!updateRes.ok) {
      console.error(`WooCommerce: Failed to update price for product ${productId}`);
      return false;
    }

    console.log(`WooCommerce: Updated price for product ${productId} to ${price}`);
    return true;
  } catch (error) {
    console.error('WooCommerce price sync error:', error);
    return false;
  }
}

// ================== PrestaShop ==================
async function syncToPrestaShop(config: PlatformConfig, sku: string, productName: string | undefined, price: number): Promise<boolean> {
  const credentials = btoa(`${config.api_key}:`);

  try {
    // Search for product
    let productId: number | null = null;

    const searchUrl = `${config.store_url}/api/products?output_format=JSON&filter[reference]=${encodeURIComponent(sku)}`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'Authorization': `Basic ${credentials}` },
    });

    if (searchRes.ok) {
      const data = await searchRes.json();
      if (data.products?.length > 0) {
        productId = data.products[0].id;
      }
    }

    if (!productId) {
      console.log(`PrestaShop: Product not found - SKU: ${sku}`);
      return false;
    }

    // Update price (PrestaShop uses XML for updates)
    const updateUrl = `${config.store_url}/api/products/${productId}`;
    const xmlBody = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <product>
    <id>${productId}</id>
    <price>${price}</price>
  </product>
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
      console.error(`PrestaShop: Failed to update price for product ${productId}`);
      return false;
    }

    console.log(`PrestaShop: Updated price for product ${productId} to ${price}`);
    return true;
  } catch (error) {
    console.error('PrestaShop price sync error:', error);
    return false;
  }
}

// ================== Shopify ==================
async function syncToShopify(config: PlatformConfig, sku: string, productName: string | undefined, price: number): Promise<boolean> {
  try {
    // Search for product by SKU in variants
    const searchUrl = `${config.store_url}/admin/api/2024-01/products.json?fields=id,variants`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'X-Shopify-Access-Token': config.api_key,
        'Content-Type': 'application/json',
      },
    });

    if (!searchRes.ok) {
      console.error('Shopify: Failed to fetch products');
      return false;
    }

    const data = await searchRes.json();
    let variantId: number | null = null;

    for (const product of data.products || []) {
      for (const variant of product.variants || []) {
        if (variant.sku === sku) {
          variantId = variant.id;
          break;
        }
      }
      if (variantId) break;
    }

    if (!variantId) {
      console.log(`Shopify: Product variant not found - SKU: ${sku}`);
      return false;
    }

    // Update variant price
    const updateUrl = `${config.store_url}/admin/api/2024-01/variants/${variantId}.json`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'X-Shopify-Access-Token': config.api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        variant: {
          id: variantId,
          price: price.toString(),
        },
      }),
    });

    if (!updateRes.ok) {
      console.error(`Shopify: Failed to update price for variant ${variantId}`);
      return false;
    }

    console.log(`Shopify: Updated price for variant ${variantId} to ${price}`);
    return true;
  } catch (error) {
    console.error('Shopify price sync error:', error);
    return false;
  }
}

// ================== OpenCart ==================
async function syncToOpenCart(config: PlatformConfig, sku: string, productName: string | undefined, price: number): Promise<boolean> {
  try {
    // Search for product
    const searchUrl = `${config.store_url}/index.php?route=api/product&model=${encodeURIComponent(sku)}`;
    const searchRes = await fetch(searchUrl, {
      headers: {
        'X-Oc-Restadmin-Id': config.api_key,
        'Content-Type': 'application/json',
      },
    });

    if (!searchRes.ok) {
      console.error('OpenCart: Failed to search products');
      return false;
    }

    const data = await searchRes.json();
    const products = data.products || data.data || [];
    const product = products.find((p: any) => p.model === sku);

    if (!product) {
      console.log(`OpenCart: Product not found - SKU: ${sku}`);
      return false;
    }

    // Update price
    const updateUrl = `${config.store_url}/index.php?route=api/product/edit&product_id=${product.product_id}`;
    const updateRes = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'X-Oc-Restadmin-Id': config.api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ price: price }),
    });

    if (!updateRes.ok) {
      console.error(`OpenCart: Failed to update price for product ${product.product_id}`);
      return false;
    }

    console.log(`OpenCart: Updated price for product ${product.product_id} to ${price}`);
    return true;
  } catch (error) {
    console.error('OpenCart price sync error:', error);
    return false;
  }
}

// ================== Magento ==================
async function syncToMagento(config: PlatformConfig, sku: string, productName: string | undefined, price: number): Promise<boolean> {
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

    // Update product price
    const updateUrl = `${config.store_url}/rest/V1/products/${encodeURIComponent(sku)}`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product: {
          sku: sku,
          price: price,
        },
      }),
    });

    if (!updateRes.ok) {
      console.error(`Magento: Failed to update price for SKU ${sku}`);
      return false;
    }

    console.log(`Magento: Updated price for SKU ${sku} to ${price}`);
    return true;
  } catch (error) {
    console.error('Magento price sync error:', error);
    return false;
  }
}

// ================== Main Handler ==================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Price sync request received');

    const body = await req.json();
    const { productId, sku, productName, price, platform } = body;

    if (!sku && !productId) {
      return new Response(JSON.stringify({ error: 'Product ID or SKU required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (typeof price !== 'number' || price < 0) {
      return new Response(JSON.stringify({ error: 'Valid price required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If productId is provided, get product details
    let productSku = sku;
    let productDisplayName = productName;

    if (productId && !sku) {
      const { data: product } = await supabase
        .from('inventory_products')
        .select('sku, name')
        .eq('id', productId)
        .single();

      if (product) {
        productSku = product.sku;
        productDisplayName = product.name;
      }
    }

    if (!productSku) {
      return new Response(JSON.stringify({ error: 'Could not determine product SKU' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: platforms } = await supabase
      .from('ecommerce_platforms')
      .select('*')
      .eq('is_enabled', true);

    if (!platforms?.length) {
      return new Response(JSON.stringify({ success: true, message: 'No platforms enabled', synced: 0 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: Record<string, boolean> = {};
    let synced = 0;
    let errors = 0;

    for (const p of platforms) {
      if (platform && p.name !== platform) continue;

      const { data: configData } = await supabase
        .from('api_settings')
        .select('setting_value')
        .eq('setting_key', `${p.name}_config`)
        .maybeSingle();

      if (!configData?.setting_value) continue;

      let config: PlatformConfig;
      try {
        config = JSON.parse(configData.setting_value);
      } catch {
        continue;
      }

      if (!config.store_url || !config.api_key) continue;

      console.log(`Syncing price to ${p.name}: ${productSku} = ${price}`);

      let success = false;

      switch (p.name) {
        case 'woocommerce':
          success = await syncToWooCommerce(config, productSku, productDisplayName, price);
          break;
        case 'prestashop':
          success = await syncToPrestaShop(config, productSku, productDisplayName, price);
          break;
        case 'shopify':
          success = await syncToShopify(config, productSku, productDisplayName, price);
          break;
        case 'opencart':
          success = await syncToOpenCart(config, productSku, productDisplayName, price);
          break;
        case 'magento':
          success = await syncToMagento(config, productSku, productDisplayName, price);
          break;
      }

      results[p.name] = success;
      if (success) synced++;
      else errors++;
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      synced,
      errors,
      message: `Цена синхронизирана в ${synced} платформи`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Price sync error:', error);
    return new Response(JSON.stringify({ error: errorMessage, errors: 1 }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

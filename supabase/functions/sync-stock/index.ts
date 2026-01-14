import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncRequest {
  product_id: string;
  sku: string;
  product_name?: string;
  new_quantity: number;
  platform?: string;
}

interface PlatformConfig {
  store_url: string;
  api_key: string;
  api_secret: string;
  is_enabled: boolean;
}

async function syncToWooCommerce(config: PlatformConfig, sku: string, productName: string | undefined, quantity: number): Promise<boolean> {
  try {
    const credentials = btoa(`${config.api_key}:${config.api_secret}`);
    
    let products: any[] = [];
    
    if (sku) {
      const searchUrl = `${config.store_url}/wp-json/wc/v3/products?sku=${encodeURIComponent(sku)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'Authorization': `Basic ${credentials}` },
      });
      
      if (searchRes.ok) {
        products = await searchRes.json();
      }
    }
    
    if (!products.length && productName) {
      console.log('Product not found by SKU, searching by name:', productName);
      const nameSearchUrl = `${config.store_url}/wp-json/wc/v3/products?search=${encodeURIComponent(productName)}`;
      const nameSearchRes = await fetch(nameSearchUrl, {
        headers: { 'Authorization': `Basic ${credentials}` },
      });
      
      if (nameSearchRes.ok) {
        const nameResults = await nameSearchRes.json();
        products = nameResults.filter((p: any) => 
          p.name.toLowerCase() === productName.toLowerCase() ||
          p.name.toLowerCase().includes(productName.toLowerCase()) ||
          productName.toLowerCase().includes(p.name.toLowerCase())
        );
      }
    }
    
    if (!products.length) {
      console.log('Product not found in WooCommerce by SKU or name:', sku, productName);
      return false;
    }
    
    const productId = products[0].id;
    console.log('Found product in WooCommerce:', productId, products[0].name);
    
    const updateUrl = `${config.store_url}/wp-json/wc/v3/products/${productId}`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stock_quantity: quantity,
        manage_stock: true,
      }),
    });
    
    if (!updateRes.ok) {
      console.error('WooCommerce update failed:', await updateRes.text());
      return false;
    }
    
    console.log('WooCommerce stock updated for:', sku || productName, 'New quantity:', quantity);
    return true;
  } catch (error) {
    console.error('WooCommerce sync error:', error);
    return false;
  }
}

async function syncToPrestaShop(config: PlatformConfig, sku: string, productName: string | undefined, quantity: number): Promise<boolean> {
  try {
    const credentials = btoa(`${config.api_key}:`);
    
    let productId: number | null = null;
    
    if (sku) {
      const searchUrl = `${config.store_url}/api/products?filter[reference]=${encodeURIComponent(sku)}&output_format=JSON`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'Authorization': `Basic ${credentials}` },
      });
      
      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.products?.length) {
          productId = data.products[0].id;
        }
      }
    }
    
    if (!productId && productName) {
      console.log('Product not found by SKU, searching by name:', productName);
      const nameSearchUrl = `${config.store_url}/api/products?filter[name]=%[${encodeURIComponent(productName)}]%&output_format=JSON`;
      const nameSearchRes = await fetch(nameSearchUrl, {
        headers: { 'Authorization': `Basic ${credentials}` },
      });
      
      if (nameSearchRes.ok) {
        const nameData = await nameSearchRes.json();
        if (nameData.products?.length) {
          productId = nameData.products[0].id;
        }
      }
    }
    
    if (!productId) {
      console.log('Product not found in PrestaShop by SKU or name:', sku, productName);
      return false;
    }
    
    const stockUrl = `${config.store_url}/api/stock_availables?filter[id_product]=${productId}&output_format=JSON`;
    const stockRes = await fetch(stockUrl, {
      headers: { 'Authorization': `Basic ${credentials}` },
    });
    
    if (!stockRes.ok) {
      console.error('PrestaShop stock fetch failed:', await stockRes.text());
      return false;
    }
    
    const stockData = await stockRes.json();
    if (!stockData.stock_availables?.length) {
      console.log('Stock not found in PrestaShop for product:', productId);
      return false;
    }
    
    const stockId = stockData.stock_availables[0].id;
    
    const updateUrl = `${config.store_url}/api/stock_availables/${stockId}`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/xml',
      },
      body: `<?xml version="1.0" encoding="UTF-8"?>
        <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
          <stock_available>
            <id>${stockId}</id>
            <quantity>${quantity}</quantity>
          </stock_available>
        </prestashop>`,
    });
    
    if (!updateRes.ok) {
      console.error('PrestaShop update failed:', await updateRes.text());
      return false;
    }
    
    console.log('PrestaShop stock updated for:', sku || productName, 'New quantity:', quantity);
    return true;
  } catch (error) {
    console.error('PrestaShop sync error:', error);
    return false;
  }
}

async function syncToShopify(config: PlatformConfig, sku: string, productName: string | undefined, quantity: number): Promise<boolean> {
  try {
    let variant: any = null;
    
    if (sku) {
      const searchUrl = `${config.store_url}/admin/api/2024-01/variants.json?sku=${encodeURIComponent(sku)}`;
      const searchRes = await fetch(searchUrl, {
        headers: {
          'X-Shopify-Access-Token': config.api_key,
          'Content-Type': 'application/json',
        },
      });
      
      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.variants?.length) {
          variant = data.variants[0];
        }
      }
    }
    
    if (!variant && productName) {
      console.log('Product not found by SKU, searching by name:', productName);
      const productsUrl = `${config.store_url}/admin/api/2024-01/products.json?title=${encodeURIComponent(productName)}`;
      const productsRes = await fetch(productsUrl, {
        headers: {
          'X-Shopify-Access-Token': config.api_key,
          'Content-Type': 'application/json',
        },
      });
      
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        if (productsData.products?.length) {
          variant = productsData.products[0].variants?.[0];
        }
      }
    }
    
    if (!variant) {
      console.log('Product not found in Shopify by SKU or name:', sku, productName);
      return false;
    }
    
    const inventoryItemId = variant.inventory_item_id;
    
    const locationsUrl = `${config.store_url}/admin/api/2024-01/locations.json`;
    const locationsRes = await fetch(locationsUrl, {
      headers: { 'X-Shopify-Access-Token': config.api_key },
    });
    
    if (!locationsRes.ok) {
      console.error('Shopify locations fetch failed');
      return false;
    }
    
    const locationsData = await locationsRes.json();
    if (!locationsData.locations?.length) {
      console.log('No locations found in Shopify');
      return false;
    }
    
    const locationId = locationsData.locations[0].id;
    
    const updateUrl = `${config.store_url}/admin/api/2024-01/inventory_levels/set.json`;
    const updateRes = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': config.api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        location_id: locationId,
        inventory_item_id: inventoryItemId,
        available: quantity,
      }),
    });
    
    if (!updateRes.ok) {
      console.error('Shopify update failed:', await updateRes.text());
      return false;
    }
    
    console.log('Shopify stock updated for:', sku || productName, 'New quantity:', quantity);
    return true;
  } catch (error) {
    console.error('Shopify sync error:', error);
    return false;
  }
}

async function syncToOpenCart(config: PlatformConfig, sku: string, productName: string | undefined, quantity: number): Promise<boolean> {
  try {
    // OpenCart REST API - search for product by model (SKU) or name
    let productId: number | null = null;
    
    // Try to find by model/SKU
    if (sku) {
      const searchUrl = `${config.store_url}/index.php?route=api/product&model=${encodeURIComponent(sku)}`;
      const searchRes = await fetch(searchUrl, {
        headers: {
          'X-Oc-Restadmin-Id': config.api_key,
          'Content-Type': 'application/json',
        },
      });
      
      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.products?.length) {
          productId = data.products[0].product_id;
        } else if (data.product_id) {
          productId = data.product_id;
        }
      }
    }
    
    // Try by name if SKU not found
    if (!productId && productName) {
      console.log('Product not found by SKU, searching by name:', productName);
      const nameSearchUrl = `${config.store_url}/index.php?route=api/product&name=${encodeURIComponent(productName)}`;
      const nameSearchRes = await fetch(nameSearchUrl, {
        headers: {
          'X-Oc-Restadmin-Id': config.api_key,
          'Content-Type': 'application/json',
        },
      });
      
      if (nameSearchRes.ok) {
        const nameData = await nameSearchRes.json();
        if (nameData.products?.length) {
          productId = nameData.products[0].product_id;
        }
      }
    }
    
    if (!productId) {
      console.log('Product not found in OpenCart by SKU or name:', sku, productName);
      return false;
    }
    
    // Update stock quantity
    const updateUrl = `${config.store_url}/index.php?route=api/product/edit&product_id=${productId}`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'X-Oc-Restadmin-Id': config.api_key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quantity: quantity,
      }),
    });
    
    if (!updateRes.ok) {
      console.error('OpenCart update failed:', await updateRes.text());
      return false;
    }
    
    console.log('OpenCart stock updated for:', sku || productName, 'New quantity:', quantity);
    return true;
  } catch (error) {
    console.error('OpenCart sync error:', error);
    return false;
  }
}

async function syncToMagento(config: PlatformConfig, sku: string, productName: string | undefined, quantity: number): Promise<boolean> {
  try {
    // Magento 2 REST API - get admin token first
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
      console.error('Magento token fetch failed:', await tokenRes.text());
      return false;
    }
    
    const token = await tokenRes.json();
    const authHeader = `Bearer ${token.replace(/"/g, '')}`;
    
    let productSku = sku;
    
    // If no SKU, search by name to find SKU
    if (!productSku && productName) {
      console.log('No SKU, searching by name:', productName);
      const searchUrl = `${config.store_url}/rest/V1/products?searchCriteria[filterGroups][0][filters][0][field]=name&searchCriteria[filterGroups][0][filters][0][value]=%${encodeURIComponent(productName)}%&searchCriteria[filterGroups][0][filters][0][conditionType]=like`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'Authorization': authHeader },
      });
      
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.items?.length) {
          productSku = searchData.items[0].sku;
        }
      }
    }
    
    if (!productSku) {
      console.log('Product not found in Magento by SKU or name:', sku, productName);
      return false;
    }
    
    // Update stock using stock items endpoint
    const stockUrl = `${config.store_url}/rest/V1/products/${encodeURIComponent(productSku)}/stockItems/1`;
    const stockRes = await fetch(stockUrl, {
      method: 'PUT',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        stockItem: {
          qty: quantity,
          is_in_stock: quantity > 0,
        },
      }),
    });
    
    if (!stockRes.ok) {
      console.error('Magento update failed:', await stockRes.text());
      return false;
    }
    
    console.log('Magento stock updated for:', productSku, 'New quantity:', quantity);
    return true;
  } catch (error) {
    console.error('Magento sync error:', error);
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Stock sync request received');

    const body = await req.json() as SyncRequest;
    console.log('Sync request:', body);

    const { product_id, sku, product_name, new_quantity, platform } = body;

    if (!sku && !product_name) {
      return new Response(JSON.stringify({ error: 'SKU or product name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: platforms } = await supabase
      .from('ecommerce_platforms')
      .select('*')
      .eq('is_enabled', true);

    if (!platforms?.length) {
      return new Response(JSON.stringify({ success: true, message: 'No platforms enabled' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: Record<string, boolean> = {};

    for (const p of platforms) {
      if (platform && p.name !== platform) continue;

      const { data: configData } = await supabase
        .from('api_settings')
        .select('setting_value')
        .eq('setting_key', `${p.name}_config`)
        .maybeSingle();

      if (!configData?.setting_value) {
        console.log(`No config found for ${p.name}`);
        continue;
      }

      let config: PlatformConfig;
      try {
        config = JSON.parse(configData.setting_value);
      } catch {
        console.log(`Invalid config for ${p.name}`);
        continue;
      }

      if (!config.store_url || !config.api_key) {
        console.log(`Incomplete config for ${p.name}`);
        continue;
      }

      switch (p.name) {
        case 'woocommerce':
          results[p.name] = await syncToWooCommerce(config, sku, product_name, new_quantity);
          break;
        case 'prestashop':
          results[p.name] = await syncToPrestaShop(config, sku, product_name, new_quantity);
          break;
        case 'shopify':
          results[p.name] = await syncToShopify(config, sku, product_name, new_quantity);
          break;
        case 'opencart':
          results[p.name] = await syncToOpenCart(config, sku, product_name, new_quantity);
          break;
        case 'magento':
          results[p.name] = await syncToMagento(config, sku, product_name, new_quantity);
          break;
      }
    }

    console.log('Sync results:', results);

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

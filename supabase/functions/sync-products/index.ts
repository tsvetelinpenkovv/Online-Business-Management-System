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

interface WooCommerceProduct {
  id: number;
  name: string;
  sku: string;
  type: string; // simple, variable, grouped, external, bundle
  status: string;
  stock_quantity: number | null;
  manage_stock: boolean;
  price: string;
  regular_price: string;
  grouped_products?: number[]; // IDs of products in a grouped product
  bundled_items?: Array<{
    product_id: number;
    quantity_min: number;
    quantity_max: number;
    quantity_default: number;
  }>;
  // For composite products
  composite_components?: Array<{
    id: number;
    title: string;
    query_ids: number[];
    quantity_min: number;
    quantity_max: number;
  }>;
}

interface PrestaShopProduct {
  id: number;
  name: string;
  reference: string;
  type: string;
  pack_items?: Array<{
    id_product_item: number;
    quantity: number;
  }>;
}

async function fetchWooCommerceProducts(config: PlatformConfig): Promise<WooCommerceProduct[]> {
  const credentials = btoa(`${config.api_key}:${config.api_secret}`);
  const products: WooCommerceProduct[] = [];
  let page = 1;
  const perPage = 100;
  
  while (true) {
    const url = `${config.store_url}/wp-json/wc/v3/products?per_page=${perPage}&page=${page}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Basic ${credentials}` },
    });
    
    if (!res.ok) break;
    
    const data = await res.json();
    if (!data.length) break;
    
    products.push(...data);
    
    if (data.length < perPage) break;
    page++;
  }
  
  return products;
}

async function fetchWooCommerceBundledItems(config: PlatformConfig, productId: number): Promise<Array<{ product_id: number; quantity: number }>> {
  const credentials = btoa(`${config.api_key}:${config.api_secret}`);
  
  // Try to get bundled items for WooCommerce Product Bundles plugin
  try {
    const url = `${config.store_url}/wp-json/wc/v3/products/${productId}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Basic ${credentials}` },
    });
    
    if (!res.ok) return [];
    
    const product = await res.json();
    
    // Check for bundled_items (WooCommerce Product Bundles)
    if (product.bundled_items?.length) {
      return product.bundled_items.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity_default || item.quantity_min || 1,
      }));
    }
    
    // Check for grouped_products
    if (product.grouped_products?.length) {
      return product.grouped_products.map((id: number) => ({
        product_id: id,
        quantity: 1,
      }));
    }
    
    // Check for composite_components
    if (product.composite_components?.length) {
      const items: Array<{ product_id: number; quantity: number }> = [];
      for (const comp of product.composite_components) {
        if (comp.query_ids?.length) {
          items.push({
            product_id: comp.query_ids[0],
            quantity: comp.quantity_min || 1,
          });
        }
      }
      return items;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching bundled items:', error);
    return [];
  }
}

async function syncWooCommerceProducts(config: PlatformConfig, supabase: any): Promise<{ synced: number; bundles: number }> {
  console.log('Fetching WooCommerce products...');
  const products = await fetchWooCommerceProducts(config);
  console.log(`Found ${products.length} WooCommerce products`);
  
  let synced = 0;
  let bundles = 0;
  
  for (const wcProduct of products) {
    // Check if product exists by SKU or name
    let existingProduct = null;
    
    if (wcProduct.sku) {
      const { data } = await supabase
        .from('inventory_products')
        .select('id, name')
        .eq('sku', wcProduct.sku)
        .maybeSingle();
      existingProduct = data;
    }
    
    if (!existingProduct && wcProduct.name) {
      const { data } = await supabase
        .from('inventory_products')
        .select('id, name')
        .ilike('name', wcProduct.name)
        .maybeSingle();
      existingProduct = data;
    }
    
    const isBundleType = ['grouped', 'bundle', 'composite'].includes(wcProduct.type);
    
    if (existingProduct) {
      // Update existing product
      await supabase
        .from('inventory_products')
        .update({
          woocommerce_id: wcProduct.id,
          is_bundle: isBundleType,
          external_bundle_type: isBundleType ? wcProduct.type : null,
        })
        .eq('id', existingProduct.id);
      synced++;
      
      // If it's a bundle, sync components
      if (isBundleType) {
        const bundledItems = await fetchWooCommerceBundledItems(config, wcProduct.id);
        
        for (const item of bundledItems) {
          // Find component product
          const wcComponentUrl = `${config.store_url}/wp-json/wc/v3/products/${item.product_id}`;
          const credentials = btoa(`${config.api_key}:${config.api_secret}`);
          const compRes = await fetch(wcComponentUrl, {
            headers: { 'Authorization': `Basic ${credentials}` },
          });
          
          if (!compRes.ok) continue;
          
          const wcComponent = await compRes.json();
          
          // Find component in inventory by SKU or name
          let componentProduct = null;
          
          if (wcComponent.sku) {
            const { data } = await supabase
              .from('inventory_products')
              .select('id')
              .eq('sku', wcComponent.sku)
              .maybeSingle();
            componentProduct = data;
          }
          
          if (!componentProduct && wcComponent.name) {
            const { data } = await supabase
              .from('inventory_products')
              .select('id')
              .ilike('name', wcComponent.name)
              .maybeSingle();
            componentProduct = data;
          }
          
          if (componentProduct) {
            // Insert or update bundle relationship
            await supabase
              .from('product_bundles')
              .upsert({
                parent_product_id: existingProduct.id,
                component_product_id: componentProduct.id,
                component_quantity: item.quantity,
              }, {
                onConflict: 'parent_product_id,component_product_id',
              });
            bundles++;
          }
        }
      }
    }
  }
  
  return { synced, bundles };
}

async function syncPrestaShopProducts(config: PlatformConfig, supabase: any): Promise<{ synced: number; bundles: number }> {
  const credentials = btoa(`${config.api_key}:`);
  let synced = 0;
  let bundles = 0;
  
  // Fetch products
  const productsUrl = `${config.store_url}/api/products?output_format=JSON&display=full`;
  const productsRes = await fetch(productsUrl, {
    headers: { 'Authorization': `Basic ${credentials}` },
  });
  
  if (!productsRes.ok) {
    console.error('Failed to fetch PrestaShop products');
    return { synced: 0, bundles: 0 };
  }
  
  const productsData = await productsRes.json();
  const products = productsData.products || [];
  
  console.log(`Found ${products.length} PrestaShop products`);
  
  for (const psProduct of products) {
    // Check if product exists by reference (SKU) or name
    let existingProduct = null;
    
    if (psProduct.reference) {
      const { data } = await supabase
        .from('inventory_products')
        .select('id, name')
        .eq('sku', psProduct.reference)
        .maybeSingle();
      existingProduct = data;
    }
    
    const productName = psProduct.name?.[0]?.value || psProduct.name;
    if (!existingProduct && productName) {
      const { data } = await supabase
        .from('inventory_products')
        .select('id, name')
        .ilike('name', productName)
        .maybeSingle();
      existingProduct = data;
    }
    
    // PrestaShop packs
    const isPack = psProduct.type === 'pack' || psProduct.is_pack === '1';
    
    if (existingProduct) {
      await supabase
        .from('inventory_products')
        .update({
          is_bundle: isPack,
          external_bundle_type: isPack ? 'pack' : null,
        })
        .eq('id', existingProduct.id);
      synced++;
      
      // Sync pack items
      if (isPack && psProduct.associations?.pack) {
        const packItems = Array.isArray(psProduct.associations.pack)
          ? psProduct.associations.pack
          : [psProduct.associations.pack];
        
        for (const packItem of packItems) {
          // Find component by ID
          const componentUrl = `${config.store_url}/api/products/${packItem.id}?output_format=JSON`;
          const compRes = await fetch(componentUrl, {
            headers: { 'Authorization': `Basic ${credentials}` },
          });
          
          if (!compRes.ok) continue;
          
          const compData = await compRes.json();
          const component = compData.product;
          
          // Find in inventory
          let componentProduct = null;
          
          if (component?.reference) {
            const { data } = await supabase
              .from('inventory_products')
              .select('id')
              .eq('sku', component.reference)
              .maybeSingle();
            componentProduct = data;
          }
          
          const compName = component?.name?.[0]?.value || component?.name;
          if (!componentProduct && compName) {
            const { data } = await supabase
              .from('inventory_products')
              .select('id')
              .ilike('name', compName)
              .maybeSingle();
            componentProduct = data;
          }
          
          if (componentProduct) {
            await supabase
              .from('product_bundles')
              .upsert({
                parent_product_id: existingProduct.id,
                component_product_id: componentProduct.id,
                component_quantity: parseInt(packItem.quantity) || 1,
              }, {
                onConflict: 'parent_product_id,component_product_id',
              });
            bundles++;
          }
        }
      }
    }
  }
  
  return { synced, bundles };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Product sync request received');
    
    const body = await req.json();
    const { platform } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get enabled platforms
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

    const results: Record<string, { synced: number; bundles: number }> = {};

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

      switch (p.name) {
        case 'woocommerce':
          results[p.name] = await syncWooCommerceProducts(config, supabase);
          break;
        case 'prestashop':
          results[p.name] = await syncPrestaShopProducts(config, supabase);
          break;
        // TODO: Add Shopify, OpenCart, Magento sync
        default:
          results[p.name] = { synced: 0, bundles: 0 };
      }
    }

    console.log('Product sync results:', results);

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Product sync error:', error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
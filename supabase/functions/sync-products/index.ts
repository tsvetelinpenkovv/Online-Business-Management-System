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
  type: string;
  status: string;
  stock_quantity: number | null;
  manage_stock: boolean;
  price: string;
  regular_price: string;
  grouped_products?: number[];
  bundled_items?: Array<{
    product_id: number;
    quantity_min: number;
    quantity_max: number;
    quantity_default: number;
  }>;
  composite_components?: Array<{
    id: number;
    title: string;
    query_ids: number[];
    quantity_min: number;
    quantity_max: number;
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
  
  try {
    const url = `${config.store_url}/wp-json/wc/v3/products/${productId}`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Basic ${credentials}` },
    });
    
    if (!res.ok) return [];
    
    const product = await res.json();
    
    if (product.bundled_items?.length) {
      return product.bundled_items.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity_default || item.quantity_min || 1,
      }));
    }
    
    if (product.grouped_products?.length) {
      return product.grouped_products.map((id: number) => ({
        product_id: id,
        quantity: 1,
      }));
    }
    
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
      await supabase
        .from('inventory_products')
        .update({
          woocommerce_id: wcProduct.id,
          is_bundle: isBundleType,
          external_bundle_type: isBundleType ? wcProduct.type : null,
        })
        .eq('id', existingProduct.id);
      synced++;
      
      if (isBundleType) {
        const bundledItems = await fetchWooCommerceBundledItems(config, wcProduct.id);
        
        for (const item of bundledItems) {
          const wcComponentUrl = `${config.store_url}/wp-json/wc/v3/products/${item.product_id}`;
          const credentials = btoa(`${config.api_key}:${config.api_secret}`);
          const compRes = await fetch(wcComponentUrl, {
            headers: { 'Authorization': `Basic ${credentials}` },
          });
          
          if (!compRes.ok) continue;
          
          const wcComponent = await compRes.json();
          
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
      
      if (isPack && psProduct.associations?.pack) {
        const packItems = Array.isArray(psProduct.associations.pack)
          ? psProduct.associations.pack
          : [psProduct.associations.pack];
        
        for (const packItem of packItems) {
          const componentUrl = `${config.store_url}/api/products/${packItem.id}?output_format=JSON`;
          const compRes = await fetch(componentUrl, {
            headers: { 'Authorization': `Basic ${credentials}` },
          });
          
          if (!compRes.ok) continue;
          
          const compData = await compRes.json();
          const component = compData.product;
          
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

async function syncShopifyProducts(config: PlatformConfig, supabase: any): Promise<{ synced: number; bundles: number }> {
  let synced = 0;
  let bundles = 0;
  
  // Fetch all products from Shopify
  const productsUrl = `${config.store_url}/admin/api/2024-01/products.json?limit=250`;
  const productsRes = await fetch(productsUrl, {
    headers: {
      'X-Shopify-Access-Token': config.api_key,
      'Content-Type': 'application/json',
    },
  });
  
  if (!productsRes.ok) {
    console.error('Failed to fetch Shopify products');
    return { synced: 0, bundles: 0 };
  }
  
  const productsData = await productsRes.json();
  const products = productsData.products || [];
  
  console.log(`Found ${products.length} Shopify products`);
  
  for (const shopifyProduct of products) {
    // Shopify products can have multiple variants
    const mainVariant = shopifyProduct.variants?.[0];
    const sku = mainVariant?.sku;
    
    let existingProduct = null;
    
    if (sku) {
      const { data } = await supabase
        .from('inventory_products')
        .select('id, name')
        .eq('sku', sku)
        .maybeSingle();
      existingProduct = data;
    }
    
    if (!existingProduct && shopifyProduct.title) {
      const { data } = await supabase
        .from('inventory_products')
        .select('id, name')
        .ilike('name', shopifyProduct.title)
        .maybeSingle();
      existingProduct = data;
    }
    
    // Check if it's a bundle (using tags or product type)
    const isBundleType = shopifyProduct.tags?.toLowerCase().includes('bundle') ||
                         shopifyProduct.product_type?.toLowerCase().includes('bundle');
    
    if (existingProduct) {
      await supabase
        .from('inventory_products')
        .update({
          is_bundle: isBundleType,
          external_bundle_type: isBundleType ? 'bundle' : null,
        })
        .eq('id', existingProduct.id);
      synced++;
      
      // Handle bundles using metafields (common pattern for Shopify bundles)
      if (isBundleType) {
        const metafieldsUrl = `${config.store_url}/admin/api/2024-01/products/${shopifyProduct.id}/metafields.json`;
        const metafieldsRes = await fetch(metafieldsUrl, {
          headers: {
            'X-Shopify-Access-Token': config.api_key,
            'Content-Type': 'application/json',
          },
        });
        
        if (metafieldsRes.ok) {
          const metafieldsData = await metafieldsRes.json();
          const bundleMetafield = metafieldsData.metafields?.find(
            (m: any) => m.key === 'bundle_products' || m.key === 'bundled_products'
          );
          
          if (bundleMetafield?.value) {
            try {
              const bundledProductIds = JSON.parse(bundleMetafield.value);
              
              for (const bundledId of bundledProductIds) {
                // Fetch bundled product
                const bundledUrl = `${config.store_url}/admin/api/2024-01/products/${bundledId.product_id || bundledId}.json`;
                const bundledRes = await fetch(bundledUrl, {
                  headers: {
                    'X-Shopify-Access-Token': config.api_key,
                    'Content-Type': 'application/json',
                  },
                });
                
                if (!bundledRes.ok) continue;
                
                const bundledData = await bundledRes.json();
                const bundledProduct = bundledData.product;
                const bundledSku = bundledProduct.variants?.[0]?.sku;
                
                let componentProduct = null;
                
                if (bundledSku) {
                  const { data } = await supabase
                    .from('inventory_products')
                    .select('id')
                    .eq('sku', bundledSku)
                    .maybeSingle();
                  componentProduct = data;
                }
                
                if (!componentProduct && bundledProduct.title) {
                  const { data } = await supabase
                    .from('inventory_products')
                    .select('id')
                    .ilike('name', bundledProduct.title)
                    .maybeSingle();
                  componentProduct = data;
                }
                
                if (componentProduct) {
                  await supabase
                    .from('product_bundles')
                    .upsert({
                      parent_product_id: existingProduct.id,
                      component_product_id: componentProduct.id,
                      component_quantity: bundledId.quantity || 1,
                    }, {
                      onConflict: 'parent_product_id,component_product_id',
                    });
                  bundles++;
                }
              }
            } catch (e) {
              console.error('Error parsing bundle metafield:', e);
            }
          }
        }
      }
    }
  }
  
  return { synced, bundles };
}

async function syncOpenCartProducts(config: PlatformConfig, supabase: any): Promise<{ synced: number; bundles: number }> {
  let synced = 0;
  let bundles = 0;
  
  // OpenCart REST API - fetch products
  const productsUrl = `${config.store_url}/index.php?route=api/product&limit=1000`;
  const productsRes = await fetch(productsUrl, {
    headers: {
      'X-Oc-Restadmin-Id': config.api_key,
      'Content-Type': 'application/json',
    },
  });
  
  if (!productsRes.ok) {
    console.error('Failed to fetch OpenCart products');
    return { synced: 0, bundles: 0 };
  }
  
  const productsData = await productsRes.json();
  const products = productsData.products || [];
  
  console.log(`Found ${products.length} OpenCart products`);
  
  for (const ocProduct of products) {
    let existingProduct = null;
    
    if (ocProduct.model) {
      const { data } = await supabase
        .from('inventory_products')
        .select('id, name')
        .eq('sku', ocProduct.model)
        .maybeSingle();
      existingProduct = data;
    }
    
    if (!existingProduct && ocProduct.name) {
      const { data } = await supabase
        .from('inventory_products')
        .select('id, name')
        .ilike('name', ocProduct.name)
        .maybeSingle();
      existingProduct = data;
    }
    
    if (existingProduct) {
      await supabase
        .from('inventory_products')
        .update({
          is_bundle: false,
          external_bundle_type: null,
        })
        .eq('id', existingProduct.id);
      synced++;
    }
  }
  
  return { synced, bundles };
}

async function syncMagentoProducts(config: PlatformConfig, supabase: any): Promise<{ synced: number; bundles: number }> {
  let synced = 0;
  let bundles = 0;
  
  // Get Magento admin token
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
    console.error('Failed to get Magento token');
    return { synced: 0, bundles: 0 };
  }
  
  const token = await tokenRes.json();
  const authHeader = `Bearer ${token.replace(/"/g, '')}`;
  
  // Fetch all products
  const productsUrl = `${config.store_url}/rest/V1/products?searchCriteria[pageSize]=1000`;
  const productsRes = await fetch(productsUrl, {
    headers: { 'Authorization': authHeader },
  });
  
  if (!productsRes.ok) {
    console.error('Failed to fetch Magento products');
    return { synced: 0, bundles: 0 };
  }
  
  const productsData = await productsRes.json();
  const products = productsData.items || [];
  
  console.log(`Found ${products.length} Magento products`);
  
  for (const magentoProduct of products) {
    let existingProduct = null;
    
    if (magentoProduct.sku) {
      const { data } = await supabase
        .from('inventory_products')
        .select('id, name')
        .eq('sku', magentoProduct.sku)
        .maybeSingle();
      existingProduct = data;
    }
    
    if (!existingProduct && magentoProduct.name) {
      const { data } = await supabase
        .from('inventory_products')
        .select('id, name')
        .ilike('name', magentoProduct.name)
        .maybeSingle();
      existingProduct = data;
    }
    
    // Check if bundle type
    const isBundleType = magentoProduct.type_id === 'bundle' || magentoProduct.type_id === 'grouped';
    
    if (existingProduct) {
      await supabase
        .from('inventory_products')
        .update({
          is_bundle: isBundleType,
          external_bundle_type: isBundleType ? magentoProduct.type_id : null,
        })
        .eq('id', existingProduct.id);
      synced++;
      
      // Handle bundles
      if (isBundleType) {
        // Fetch bundle options
        const bundleUrl = `${config.store_url}/rest/V1/bundle-products/${encodeURIComponent(magentoProduct.sku)}/options/all`;
        const bundleRes = await fetch(bundleUrl, {
          headers: { 'Authorization': authHeader },
        });
        
        if (bundleRes.ok) {
          const bundleOptions = await bundleRes.json();
          
          for (const option of bundleOptions) {
            for (const selection of option.product_links || []) {
              // Find component product
              const { data: componentProduct } = await supabase
                .from('inventory_products')
                .select('id')
                .eq('sku', selection.sku)
                .maybeSingle();
              
              if (componentProduct) {
                await supabase
                  .from('product_bundles')
                  .upsert({
                    parent_product_id: existingProduct.id,
                    component_product_id: componentProduct.id,
                    component_quantity: selection.qty || 1,
                  }, {
                    onConflict: 'parent_product_id,component_product_id',
                  });
                bundles++;
              }
            }
          }
        }
        
        // For grouped products
        if (magentoProduct.type_id === 'grouped') {
          const linkedUrl = `${config.store_url}/rest/V1/products/${encodeURIComponent(magentoProduct.sku)}/links/associated`;
          const linkedRes = await fetch(linkedUrl, {
            headers: { 'Authorization': authHeader },
          });
          
          if (linkedRes.ok) {
            const linkedProducts = await linkedRes.json();
            
            for (const linked of linkedProducts) {
              const { data: componentProduct } = await supabase
                .from('inventory_products')
                .select('id')
                .eq('sku', linked.linked_product_sku)
                .maybeSingle();
              
              if (componentProduct) {
                await supabase
                  .from('product_bundles')
                  .upsert({
                    parent_product_id: existingProduct.id,
                    component_product_id: componentProduct.id,
                    component_quantity: linked.qty || 1,
                  }, {
                    onConflict: 'parent_product_id,component_product_id',
                  });
                bundles++;
              }
            }
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
        case 'shopify':
          results[p.name] = await syncShopifyProducts(config, supabase);
          break;
        case 'opencart':
          results[p.name] = await syncOpenCartProducts(config, supabase);
          break;
        case 'magento':
          results[p.name] = await syncMagentoProducts(config, supabase);
          break;
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

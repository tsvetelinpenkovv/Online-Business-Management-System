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
  created: number;
  bundles: number;
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
  description: string;
  short_description: string;
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

// Helper to generate unique SKU if missing
function generateSku(platformPrefix: string, productId: number | string): string {
  return `${platformPrefix}-${productId}`;
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

async function syncWooCommerceProducts(config: PlatformConfig, supabase: any): Promise<SyncResult> {
  console.log('Fetching WooCommerce products...');
  const products = await fetchWooCommerceProducts(config);
  console.log(`Found ${products.length} WooCommerce products`);
  
  let synced = 0;
  let created = 0;
  let bundles = 0;
  
  for (const wcProduct of products) {
    let existingProduct = null;
    const sku = wcProduct.sku || generateSku('WC', wcProduct.id);
    
    // Try to find by SKU first
    if (wcProduct.sku) {
      const { data } = await supabase
        .from('inventory_products')
        .select('id, name')
        .eq('sku', wcProduct.sku)
        .maybeSingle();
      existingProduct = data;
    }
    
    // Try to find by name if no SKU match
    if (!existingProduct && wcProduct.name) {
      const { data } = await supabase
        .from('inventory_products')
        .select('id, name')
        .ilike('name', wcProduct.name)
        .maybeSingle();
      existingProduct = data;
    }
    
    const isBundleType = ['grouped', 'bundle', 'composite'].includes(wcProduct.type);
    const salePrice = parseFloat(wcProduct.price) || parseFloat(wcProduct.regular_price) || 0;
    
    if (existingProduct) {
      // Update existing product
      await supabase
        .from('inventory_products')
        .update({
          woocommerce_id: wcProduct.id,
          is_bundle: isBundleType,
          external_bundle_type: isBundleType ? wcProduct.type : null,
          current_stock: wcProduct.manage_stock ? (wcProduct.stock_quantity || 0) : existingProduct.current_stock,
          sale_price: salePrice || undefined,
        })
        .eq('id', existingProduct.id);
      synced++;
    } else {
      // CREATE NEW PRODUCT
      console.log(`Creating new product from WooCommerce: ${wcProduct.name} (SKU: ${sku})`);
      const { data: newProduct, error } = await supabase
        .from('inventory_products')
        .insert({
          sku: sku,
          name: wcProduct.name,
          description: wcProduct.short_description || wcProduct.description || null,
          sale_price: salePrice,
          purchase_price: 0,
          current_stock: wcProduct.manage_stock ? (wcProduct.stock_quantity || 0) : 0,
          min_stock_level: 0,
          woocommerce_id: wcProduct.id,
          is_bundle: isBundleType,
          external_bundle_type: isBundleType ? wcProduct.type : null,
          is_active: wcProduct.status === 'publish',
        })
        .select('id')
        .single();
      
      if (error) {
        console.error(`Error creating product ${wcProduct.name}:`, error);
        continue;
      }
      
      existingProduct = newProduct;
      created++;
    }
    
    // Handle bundles
    if (isBundleType && existingProduct) {
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
  
  return { synced, created, bundles };
}

async function syncPrestaShopProducts(config: PlatformConfig, supabase: any): Promise<SyncResult> {
  const credentials = btoa(`${config.api_key}:`);
  let synced = 0;
  let created = 0;
  let bundles = 0;
  
  const productsUrl = `${config.store_url}/api/products?output_format=JSON&display=full`;
  const productsRes = await fetch(productsUrl, {
    headers: { 'Authorization': `Basic ${credentials}` },
  });
  
  if (!productsRes.ok) {
    console.error('Failed to fetch PrestaShop products');
    return { synced: 0, created: 0, bundles: 0 };
  }
  
  const productsData = await productsRes.json();
  const products = productsData.products || [];
  
  console.log(`Found ${products.length} PrestaShop products`);
  
  for (const psProduct of products) {
    let existingProduct = null;
    const sku = psProduct.reference || generateSku('PS', psProduct.id);
    const productName = psProduct.name?.[0]?.value || psProduct.name || `PrestaShop Product ${psProduct.id}`;
    
    if (psProduct.reference) {
      const { data } = await supabase
        .from('inventory_products')
        .select('id, name')
        .eq('sku', psProduct.reference)
        .maybeSingle();
      existingProduct = data;
    }
    
    if (!existingProduct && productName) {
      const { data } = await supabase
        .from('inventory_products')
        .select('id, name')
        .ilike('name', productName)
        .maybeSingle();
      existingProduct = data;
    }
    
    const isPack = psProduct.type === 'pack' || psProduct.is_pack === '1';
    const salePrice = parseFloat(psProduct.price) || 0;
    const description = psProduct.description?.[0]?.value || psProduct.description_short?.[0]?.value || null;
    
    if (existingProduct) {
      await supabase
        .from('inventory_products')
        .update({
          is_bundle: isPack,
          external_bundle_type: isPack ? 'pack' : null,
          current_stock: parseInt(psProduct.quantity) || 0,
          sale_price: salePrice || undefined,
        })
        .eq('id', existingProduct.id);
      synced++;
    } else {
      // CREATE NEW PRODUCT
      console.log(`Creating new product from PrestaShop: ${productName} (SKU: ${sku})`);
      const { data: newProduct, error } = await supabase
        .from('inventory_products')
        .insert({
          sku: sku,
          name: productName,
          description: description,
          sale_price: salePrice,
          purchase_price: parseFloat(psProduct.wholesale_price) || 0,
          current_stock: parseInt(psProduct.quantity) || 0,
          min_stock_level: parseInt(psProduct.minimal_quantity) || 0,
          is_bundle: isPack,
          external_bundle_type: isPack ? 'pack' : null,
          is_active: psProduct.active === '1',
        })
        .select('id')
        .single();
      
      if (error) {
        console.error(`Error creating product ${productName}:`, error);
        continue;
      }
      
      existingProduct = newProduct;
      created++;
    }
    
    // Handle pack bundles
    if (isPack && psProduct.associations?.pack && existingProduct) {
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
  
  return { synced, created, bundles };
}

async function syncShopifyProducts(config: PlatformConfig, supabase: any): Promise<SyncResult> {
  let synced = 0;
  let created = 0;
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
    return { synced: 0, created: 0, bundles: 0 };
  }
  
  const productsData = await productsRes.json();
  const products = productsData.products || [];
  
  console.log(`Found ${products.length} Shopify products`);
  
  for (const shopifyProduct of products) {
    const mainVariant = shopifyProduct.variants?.[0];
    const sku = mainVariant?.sku || generateSku('SH', shopifyProduct.id);
    
    let existingProduct = null;
    
    if (mainVariant?.sku) {
      const { data } = await supabase
        .from('inventory_products')
        .select('id, name')
        .eq('sku', mainVariant.sku)
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
    
    const isBundleType = shopifyProduct.tags?.toLowerCase().includes('bundle') ||
                         shopifyProduct.product_type?.toLowerCase().includes('bundle');
    const salePrice = parseFloat(mainVariant?.price) || 0;
    const stockQuantity = mainVariant?.inventory_quantity || 0;
    
    if (existingProduct) {
      await supabase
        .from('inventory_products')
        .update({
          is_bundle: isBundleType,
          external_bundle_type: isBundleType ? 'bundle' : null,
          current_stock: stockQuantity,
          sale_price: salePrice || undefined,
        })
        .eq('id', existingProduct.id);
      synced++;
    } else {
      // CREATE NEW PRODUCT
      console.log(`Creating new product from Shopify: ${shopifyProduct.title} (SKU: ${sku})`);
      const { data: newProduct, error } = await supabase
        .from('inventory_products')
        .insert({
          sku: sku,
          name: shopifyProduct.title,
          description: shopifyProduct.body_html?.replace(/<[^>]*>/g, '') || null,
          sale_price: salePrice,
          purchase_price: 0,
          current_stock: stockQuantity,
          min_stock_level: 0,
          is_bundle: isBundleType,
          external_bundle_type: isBundleType ? 'bundle' : null,
          is_active: shopifyProduct.status === 'active',
        })
        .select('id')
        .single();
      
      if (error) {
        console.error(`Error creating product ${shopifyProduct.title}:`, error);
        continue;
      }
      
      existingProduct = newProduct;
      created++;
    }
    
    // Handle bundles using metafields
    if (isBundleType && existingProduct) {
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
  
  return { synced, created, bundles };
}

async function syncOpenCartProducts(config: PlatformConfig, supabase: any): Promise<SyncResult> {
  let synced = 0;
  let created = 0;
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
    return { synced: 0, created: 0, bundles: 0 };
  }
  
  const productsData = await productsRes.json();
  const products = productsData.products || productsData.data || [];
  
  console.log(`Found ${products.length} OpenCart products`);
  
  for (const ocProduct of products) {
    let existingProduct = null;
    const sku = ocProduct.model || generateSku('OC', ocProduct.product_id);
    
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
    
    const salePrice = parseFloat(ocProduct.price) || 0;
    const stockQuantity = parseInt(ocProduct.quantity) || 0;
    
    if (existingProduct) {
      await supabase
        .from('inventory_products')
        .update({
          is_bundle: false,
          external_bundle_type: null,
          current_stock: stockQuantity,
          sale_price: salePrice || undefined,
        })
        .eq('id', existingProduct.id);
      synced++;
    } else {
      // CREATE NEW PRODUCT
      console.log(`Creating new product from OpenCart: ${ocProduct.name} (SKU: ${sku})`);
      const { data: newProduct, error } = await supabase
        .from('inventory_products')
        .insert({
          sku: sku,
          name: ocProduct.name || `OpenCart Product ${ocProduct.product_id}`,
          description: ocProduct.description?.replace(/<[^>]*>/g, '') || null,
          sale_price: salePrice,
          purchase_price: 0,
          current_stock: stockQuantity,
          min_stock_level: parseInt(ocProduct.minimum) || 0,
          is_bundle: false,
          external_bundle_type: null,
          is_active: ocProduct.status === '1',
        })
        .select('id')
        .single();
      
      if (error) {
        console.error(`Error creating product ${ocProduct.name}:`, error);
        continue;
      }
      
      existingProduct = newProduct;
      created++;
    }
  }
  
  return { synced, created, bundles };
}

async function syncMagentoProducts(config: PlatformConfig, supabase: any): Promise<SyncResult> {
  let synced = 0;
  let created = 0;
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
    return { synced: 0, created: 0, bundles: 0 };
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
    return { synced: 0, created: 0, bundles: 0 };
  }
  
  const productsData = await productsRes.json();
  const products = productsData.items || [];
  
  console.log(`Found ${products.length} Magento products`);
  
  for (const magentoProduct of products) {
    let existingProduct = null;
    const sku = magentoProduct.sku || generateSku('MG', magentoProduct.id);
    
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
    
    const isBundleType = magentoProduct.type_id === 'bundle' || magentoProduct.type_id === 'grouped';
    const salePrice = magentoProduct.price || 0;
    
    // Get stock quantity from extension attributes
    let stockQuantity = 0;
    if (magentoProduct.extension_attributes?.stock_item) {
      stockQuantity = magentoProduct.extension_attributes.stock_item.qty || 0;
    }
    
    // Get description from custom attributes
    let description = null;
    if (magentoProduct.custom_attributes) {
      const descAttr = magentoProduct.custom_attributes.find((a: any) => a.attribute_code === 'description' || a.attribute_code === 'short_description');
      if (descAttr) {
        description = descAttr.value?.replace(/<[^>]*>/g, '') || null;
      }
    }
    
    if (existingProduct) {
      await supabase
        .from('inventory_products')
        .update({
          is_bundle: isBundleType,
          external_bundle_type: isBundleType ? magentoProduct.type_id : null,
          current_stock: stockQuantity,
          sale_price: salePrice || undefined,
        })
        .eq('id', existingProduct.id);
      synced++;
    } else {
      // CREATE NEW PRODUCT
      console.log(`Creating new product from Magento: ${magentoProduct.name} (SKU: ${sku})`);
      const { data: newProduct, error } = await supabase
        .from('inventory_products')
        .insert({
          sku: sku,
          name: magentoProduct.name || `Magento Product ${magentoProduct.id}`,
          description: description,
          sale_price: salePrice,
          purchase_price: 0,
          current_stock: stockQuantity,
          min_stock_level: 0,
          is_bundle: isBundleType,
          external_bundle_type: isBundleType ? magentoProduct.type_id : null,
          is_active: magentoProduct.status === 1,
        })
        .select('id')
        .single();
      
      if (error) {
        console.error(`Error creating product ${magentoProduct.name}:`, error);
        continue;
      }
      
      existingProduct = newProduct;
      created++;
    }
    
    // Handle bundles
    if (isBundleType && existingProduct) {
      // Fetch bundle options
      const bundleUrl = `${config.store_url}/rest/V1/bundle-products/${encodeURIComponent(magentoProduct.sku)}/options/all`;
      const bundleRes = await fetch(bundleUrl, {
        headers: { 'Authorization': authHeader },
      });
      
      if (bundleRes.ok) {
        const bundleOptions = await bundleRes.json();
        
        for (const option of bundleOptions) {
          for (const selection of option.product_links || []) {
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
  
  return { synced, created, bundles };
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
      return new Response(JSON.stringify({ success: true, message: 'No platforms enabled', results: {} }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: Record<string, SyncResult> = {};

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

      console.log(`Syncing products from ${p.name}...`);

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
          results[p.name] = { synced: 0, created: 0, bundles: 0 };
      }
      
      console.log(`${p.name} sync complete:`, results[p.name]);
    }

    console.log('Product sync results:', results);

    // Calculate totals
    const totals = {
      synced: Object.values(results).reduce((sum, r) => sum + r.synced, 0),
      created: Object.values(results).reduce((sum, r) => sum + r.created, 0),
      bundles: Object.values(results).reduce((sum, r) => sum + r.bundles, 0),
    };

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      totals,
      message: `Синхронизирани: ${totals.synced}, Създадени: ${totals.created}, Бъндъли: ${totals.bundles}`
    }), {
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

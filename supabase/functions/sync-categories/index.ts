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
  imported: number;
  exported: number;
  errors: number;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
}

// ================== WooCommerce ==================
async function syncWooCommerceCategories(config: PlatformConfig, supabase: any, direction: 'import' | 'export'): Promise<SyncResult> {
  const credentials = btoa(`${config.api_key}:${config.api_secret}`);
  let imported = 0, exported = 0, errors = 0;

  if (direction === 'import') {
    // Fetch categories from WooCommerce
    const url = `${config.store_url}/wp-json/wc/v3/products/categories?per_page=100`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Basic ${credentials}` },
    });

    if (!res.ok) {
      console.error('Failed to fetch WooCommerce categories');
      return { imported: 0, exported: 0, errors: 1 };
    }

    const wcCategories = await res.json();
    console.log(`Found ${wcCategories.length} WooCommerce categories`);

    // Map WooCommerce category IDs to our IDs for parent relationships
    const wcToLocalMap: Record<number, string> = {};

    // First pass: create/update categories without parents
    for (const wcCat of wcCategories) {
      const { data: existing } = await supabase
        .from('inventory_categories')
        .select('id')
        .ilike('name', wcCat.name)
        .maybeSingle();

      if (existing) {
        wcToLocalMap[wcCat.id] = existing.id;
      } else {
        const { data: newCat, error } = await supabase
          .from('inventory_categories')
          .insert({
            name: wcCat.name,
            description: wcCat.description?.replace(/<[^>]*>/g, '') || null,
          })
          .select('id')
          .single();

        if (error) {
          console.error(`Error creating category ${wcCat.name}:`, error);
          errors++;
          continue;
        }

        wcToLocalMap[wcCat.id] = newCat.id;
        imported++;
      }
    }

    // Second pass: update parent relationships
    for (const wcCat of wcCategories) {
      if (wcCat.parent && wcCat.parent > 0 && wcToLocalMap[wcCat.id] && wcToLocalMap[wcCat.parent]) {
        await supabase
          .from('inventory_categories')
          .update({ parent_id: wcToLocalMap[wcCat.parent] })
          .eq('id', wcToLocalMap[wcCat.id]);
      }
    }
  } else {
    // Export categories to WooCommerce
    const { data: categories } = await supabase
      .from('inventory_categories')
      .select('*')
      .order('created_at');

    if (!categories?.length) return { imported: 0, exported: 0, errors: 0 };

    // Map our IDs to WooCommerce IDs
    const localToWcMap: Record<string, number> = {};

    for (const cat of categories) {
      // Check if category exists in WooCommerce
      const searchUrl = `${config.store_url}/wp-json/wc/v3/products/categories?search=${encodeURIComponent(cat.name)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { 'Authorization': `Basic ${credentials}` },
      });

      if (searchRes.ok) {
        const existing = await searchRes.json();
        const exactMatch = existing.find((c: any) => c.name.toLowerCase() === cat.name.toLowerCase());

        if (exactMatch) {
          localToWcMap[cat.id] = exactMatch.id;
          continue;
        }
      }

      // Create new category
      const createUrl = `${config.store_url}/wp-json/wc/v3/products/categories`;
      const parentWcId = cat.parent_id && localToWcMap[cat.parent_id] ? localToWcMap[cat.parent_id] : 0;

      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: cat.name,
          description: cat.description || '',
          parent: parentWcId,
        }),
      });

      if (createRes.ok) {
        const newWcCat = await createRes.json();
        localToWcMap[cat.id] = newWcCat.id;
        exported++;
      } else {
        console.error(`Failed to create WooCommerce category ${cat.name}`);
        errors++;
      }
    }
  }

  return { imported, exported, errors };
}

// ================== PrestaShop ==================
async function syncPrestaShopCategories(config: PlatformConfig, supabase: any, direction: 'import' | 'export'): Promise<SyncResult> {
  const credentials = btoa(`${config.api_key}:`);
  let imported = 0, exported = 0, errors = 0;

  if (direction === 'import') {
    const url = `${config.store_url}/api/categories?output_format=JSON&display=full`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Basic ${credentials}` },
    });

    if (!res.ok) {
      console.error('Failed to fetch PrestaShop categories');
      return { imported: 0, exported: 0, errors: 1 };
    }

    const data = await res.json();
    const psCategories = data.categories || [];
    const psToLocalMap: Record<number, string> = {};

    for (const psCat of psCategories) {
      // Skip root categories
      if (psCat.is_root_category === '1') continue;

      const catName = psCat.name?.[0]?.value || psCat.name || '';
      if (!catName) continue;

      const { data: existing } = await supabase
        .from('inventory_categories')
        .select('id')
        .ilike('name', catName)
        .maybeSingle();

      if (existing) {
        psToLocalMap[psCat.id] = existing.id;
      } else {
        const description = psCat.description?.[0]?.value || null;
        const { data: newCat, error } = await supabase
          .from('inventory_categories')
          .insert({
            name: catName,
            description: description?.replace(/<[^>]*>/g, '') || null,
          })
          .select('id')
          .single();

        if (error) {
          errors++;
          continue;
        }

        psToLocalMap[psCat.id] = newCat.id;
        imported++;
      }
    }

    // Update parent relationships
    for (const psCat of psCategories) {
      if (psCat.id_parent && parseInt(psCat.id_parent) > 2 && psToLocalMap[psCat.id] && psToLocalMap[psCat.id_parent]) {
        await supabase
          .from('inventory_categories')
          .update({ parent_id: psToLocalMap[psCat.id_parent] })
          .eq('id', psToLocalMap[psCat.id]);
      }
    }
  } else {
    // Export - PrestaShop category creation is complex, logging for now
    console.log('PrestaShop category export requires XML API - not fully implemented');
    errors++;
  }

  return { imported, exported, errors };
}

// ================== Shopify ==================
async function syncShopifyCategories(config: PlatformConfig, supabase: any, direction: 'import' | 'export'): Promise<SyncResult> {
  let imported = 0, exported = 0, errors = 0;

  if (direction === 'import') {
    // Shopify uses "collections" instead of categories
    const url = `${config.store_url}/admin/api/2024-01/custom_collections.json`;
    const res = await fetch(url, {
      headers: {
        'X-Shopify-Access-Token': config.api_key,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch Shopify collections');
      return { imported: 0, exported: 0, errors: 1 };
    }

    const data = await res.json();
    const collections = data.custom_collections || [];

    // Also fetch smart collections
    const smartUrl = `${config.store_url}/admin/api/2024-01/smart_collections.json`;
    const smartRes = await fetch(smartUrl, {
      headers: {
        'X-Shopify-Access-Token': config.api_key,
        'Content-Type': 'application/json',
      },
    });

    if (smartRes.ok) {
      const smartData = await smartRes.json();
      collections.push(...(smartData.smart_collections || []));
    }

    for (const coll of collections) {
      const { data: existing } = await supabase
        .from('inventory_categories')
        .select('id')
        .ilike('name', coll.title)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from('inventory_categories')
          .insert({
            name: coll.title,
            description: coll.body_html?.replace(/<[^>]*>/g, '') || null,
          });

        if (error) {
          errors++;
        } else {
          imported++;
        }
      }
    }
  } else {
    // Export categories as custom collections
    const { data: categories } = await supabase
      .from('inventory_categories')
      .select('*')
      .is('parent_id', null);

    if (!categories?.length) return { imported: 0, exported: 0, errors: 0 };

    for (const cat of categories) {
      // Check if collection exists
      const searchUrl = `${config.store_url}/admin/api/2024-01/custom_collections.json?title=${encodeURIComponent(cat.name)}`;
      const searchRes = await fetch(searchUrl, {
        headers: {
          'X-Shopify-Access-Token': config.api_key,
          'Content-Type': 'application/json',
        },
      });

      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.custom_collections?.some((c: any) => c.title.toLowerCase() === cat.name.toLowerCase())) {
          continue;
        }
      }

      // Create collection
      const createUrl = `${config.store_url}/admin/api/2024-01/custom_collections.json`;
      const createRes = await fetch(createUrl, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': config.api_key,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          custom_collection: {
            title: cat.name,
            body_html: cat.description || '',
          },
        }),
      });

      if (createRes.ok) {
        exported++;
      } else {
        errors++;
      }
    }
  }

  return { imported, exported, errors };
}

// ================== OpenCart ==================
async function syncOpenCartCategories(config: PlatformConfig, supabase: any, direction: 'import' | 'export'): Promise<SyncResult> {
  let imported = 0, exported = 0, errors = 0;

  if (direction === 'import') {
    const url = `${config.store_url}/index.php?route=api/category`;
    const res = await fetch(url, {
      headers: {
        'X-Oc-Restadmin-Id': config.api_key,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('Failed to fetch OpenCart categories');
      return { imported: 0, exported: 0, errors: 1 };
    }

    const data = await res.json();
    const categories = data.categories || data.data || [];

    for (const ocCat of categories) {
      const { data: existing } = await supabase
        .from('inventory_categories')
        .select('id')
        .ilike('name', ocCat.name)
        .maybeSingle();

      if (!existing) {
        const { error } = await supabase
          .from('inventory_categories')
          .insert({
            name: ocCat.name,
            description: ocCat.description?.replace(/<[^>]*>/g, '') || null,
          });

        if (error) {
          errors++;
        } else {
          imported++;
        }
      }
    }
  } else {
    console.log('OpenCart category export not fully implemented');
    errors++;
  }

  return { imported, exported, errors };
}

// ================== Magento ==================
async function syncMagentoCategories(config: PlatformConfig, supabase: any, direction: 'import' | 'export'): Promise<SyncResult> {
  let imported = 0, exported = 0, errors = 0;

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
    return { imported: 0, exported: 0, errors: 1 };
  }

  const token = await tokenRes.json();
  const authHeader = `Bearer ${token.replace(/"/g, '')}`;

  if (direction === 'import') {
    const url = `${config.store_url}/rest/V1/categories`;
    const res = await fetch(url, {
      headers: { 'Authorization': authHeader },
    });

    if (!res.ok) {
      console.error('Failed to fetch Magento categories');
      return { imported: 0, exported: 0, errors: 1 };
    }

    const rootCategory = await res.json();

    // Recursively process categories
    const processCategory = async (cat: any, parentId: string | null = null) => {
      if (cat.level < 2) {
        // Skip root and default categories
        for (const child of cat.children_data || []) {
          await processCategory(child, null);
        }
        return;
      }

      const { data: existing } = await supabase
        .from('inventory_categories')
        .select('id')
        .ilike('name', cat.name)
        .maybeSingle();

      let localId: string;

      if (existing) {
        localId = existing.id;
      } else {
        const { data: newCat, error } = await supabase
          .from('inventory_categories')
          .insert({
            name: cat.name,
            parent_id: parentId,
          })
          .select('id')
          .single();

        if (error) {
          errors++;
          return;
        }

        localId = newCat.id;
        imported++;
      }

      for (const child of cat.children_data || []) {
        await processCategory(child, localId);
      }
    };

    await processCategory(rootCategory);
  } else {
    console.log('Magento category export not fully implemented');
    errors++;
  }

  return { imported, exported, errors };
}

// ================== Main Handler ==================
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Category sync request received');

    const body = await req.json();
    const { platform, direction = 'import' } = body;

    if (!['import', 'export'].includes(direction)) {
      return new Response(JSON.stringify({ error: 'Invalid direction. Use "import" or "export"' }), {
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

      console.log(`Syncing categories ${direction} ${p.name}...`);

      switch (p.name) {
        case 'woocommerce':
          results[p.name] = await syncWooCommerceCategories(config, supabase, direction);
          break;
        case 'prestashop':
          results[p.name] = await syncPrestaShopCategories(config, supabase, direction);
          break;
        case 'shopify':
          results[p.name] = await syncShopifyCategories(config, supabase, direction);
          break;
        case 'opencart':
          results[p.name] = await syncOpenCartCategories(config, supabase, direction);
          break;
        case 'magento':
          results[p.name] = await syncMagentoCategories(config, supabase, direction);
          break;
        default:
          results[p.name] = { imported: 0, exported: 0, errors: 0 };
      }

      console.log(`${p.name} category sync complete:`, results[p.name]);
    }

    const totals = {
      imported: Object.values(results).reduce((sum, r) => sum + r.imported, 0),
      exported: Object.values(results).reduce((sum, r) => sum + r.exported, 0),
      errors: Object.values(results).reduce((sum, r) => sum + r.errors, 0),
    };

    return new Response(JSON.stringify({
      success: true,
      direction,
      results,
      totals,
      imported: totals.imported,
      exported: totals.exported,
      errors: totals.errors,
      message: direction === 'import'
        ? `Импортирани: ${totals.imported} категории`
        : `Експортирани: ${totals.exported} категории`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Category sync error:', error);
    return new Response(JSON.stringify({ error: errorMessage, errors: 1 }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

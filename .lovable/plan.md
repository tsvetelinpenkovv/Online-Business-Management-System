

# Ultra Deep Performance Optimization Plan

## Root Cause Analysis

The app's boot waterfall currently looks like this:

```text
TIME ──────────────────────────────────────────────────────────────►

1. SecretPathGuard         ██████ (DB query: company_settings)
   ↓ blocks ALL rendering
2. Auth state              ███ (supabase.auth.getSession)
   ↓ blocks page render  
3. Page mount fires 6+ parallel DB queries:
   - usePermissions        ██████ (2 queries: allowed_users + role_permissions)
   - useCompanyLogo        ████ (storage.list)
   - useInterfaceTexts     ████ (api_settings)
   - useSiteCustomization  ████ (api_settings)
   - useStores             ████ (stores + company_settings)
   - useOrders/useInventory██████████ (main data)
   - company_settings      ████ (Index.tsx fetches AGAIN)
   - get_inventory_stats   ████ (Inventory.tsx RPC)
4. UI renders only AFTER all above resolve
```

**Key bottlenecks identified:**

1. **company_settings queried 4+ times per page load** — SecretPathGuard, Index.tsx, useStores, and Inventory.tsx all independently query company_settings
2. **useCompanyLogo uses storage.list() + cache buster** — `?t=${Date.now()}` defeats ALL caching, forcing a fresh download every single mount
3. **useInterfaceTexts imports ALL of lucide-react** — `import * as LucideIcons from 'lucide-react'` pulls the entire icon library into the bundle (~200KB+)
4. **useRealtimeOrders triggers full refetch** — every INSERT/UPDATE/DELETE event calls `refetch()` which re-queries the entire orders page
5. **useInventory still fetches products on mount** — `fetchProducts()` is defined but `fetchAll()` only calls categories/units/suppliers. However, `createProduct`/`updateProduct`/`deleteProduct` call `fetchProducts()` which loads ALL products without pagination
6. **No data prefetching between pages** — navigating from Orders to Inventory triggers a complete cold-start data fetch

## Optimization Plan (5 changes, zero visual impact)

### 1. Eliminate duplicate company_settings queries
**Files:** `src/pages/Index.tsx`, `src/pages/Inventory.tsx`, `src/hooks/useStores.tsx`

- Create a shared `useCompanySettings` hook that queries `company_settings` once and caches via React Query (`queryKey: ['company_settings']`)
- Replace all 4+ independent `supabase.from('company_settings')` calls with this single hook
- SecretPathGuard already caches in sessionStorage — keep that, but make page-level settings use React Query

### 2. Fix useCompanyLogo cache-busting and storage.list overhead
**File:** `src/hooks/useCompanyLogo.tsx`

- Cache the logo URL in `localStorage` so subsequent mounts show it instantly
- Remove `?t=${Date.now()}` cache buster — use a version-based approach (only bust on upload)
- Show cached URL immediately, then verify in background

### 3. Fix lucide-react barrel import in useInterfaceTexts
**File:** `src/hooks/useInterfaceTexts.tsx`

- Replace `import * as LucideIcons from 'lucide-react'` with a map of individually imported icons
- This prevents Vite from bundling the entire lucide-react library (saves ~150-200KB from the critical path)

### 4. Debounce realtime refetch calls
**File:** `src/hooks/useRealtimeOrders.tsx`

- Currently every realtime event triggers an immediate `refetch()` — if 10 orders arrive in 1 second, that's 10 full queries
- Add a 2-second debounce/throttle so rapid events batch into a single refetch

### 5. Prevent full product list fetch after mutations in useInventory
**File:** `src/hooks/useInventory.tsx`

- `createProduct`, `updateProduct`, `deleteProduct` all call `fetchProducts()` which loads ALL products without pagination
- With 700k products this is catastrophic — replace with targeted cache invalidation or optimistic local state updates
- After mutation, only refetch the current paginated page via `useProductsPage.refetch()`

### 6. Add database composite index for orders query
**Migration:** Add a composite index on `orders(created_at DESC, id DESC)` to match the exact ORDER BY used by `useOrders.buildQuery`

```sql
CREATE INDEX IF NOT EXISTS idx_orders_created_at_id ON public.orders (created_at DESC, id DESC);
```

The existing `idx_orders_created_at` only covers `created_at DESC` but the query also sorts by `id DESC`, forcing a secondary sort in memory.

## Technical Summary

| Change | Impact | Risk |
|--------|--------|------|
| Shared company_settings hook | Eliminates 3-4 redundant DB round-trips per page load | Low |
| Logo caching | Instant logo display, no storage.list() on every mount | Low |
| Fix lucide barrel import | ~150-200KB smaller critical bundle | Low |
| Debounce realtime refetch | Prevents query storms from rapid order events | Low |
| Stop full product refetch | Prevents loading 700k rows after every mutation | Medium |
| Composite index | Faster ORDER BY for paginated orders query | None |

All changes are logic/architecture only — zero visual impact.


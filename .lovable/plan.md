

# Пълен одит на складовата система — констатации и план за корекция

## Резултати от одита

### A. Критични проблеми (блокиращи при мащаб)

1. **`useInventory()` се инстанцира 4 пъти независимо** — `Inventory.tsx`, `WarehouseDashboard`, `WarehouseKPIDashboard`, `StockTransferDialog` — всеки прави собствени `fetchProducts()` + `fetchMovements()` + `fetchBatches()` + `fetchDocuments()` без лимит. При 100K продукта това зарежда ВСИЧКО 4 пъти.
   - `InventoryDashboard` ползва `inventory.products` (без лимит), `inventory.movements` (limit 100), `inventory.getInventoryStats()` — всичко client-side.
   - `ForecastTab` ползва `inventory.products` и `inventory.movements` — client-side прогнози върху ALL products.

2. **MovementsTab и DocumentsTab** — client-side филтриране/сортиране. Движенията имат limit 100, но документите — без limit. При 1M поръчки ще има хиляди движения и документи.

3. **`useInventory.fetchProducts()` няма пагинация** — зарежда `select(*)` + JOINs без `.range()`. Supabase ще отреже на 1000 реда мълчаливо.

4. **Dashboard статистики** (`getInventoryStats`, `criticalStockInfo` в `Inventory.tsx`) разчитат на `inventory.products` (всички в паметта) — при 100K продукта това е невъзможно.

### B. Функционални пропуски

5. **Липсва SKU дублиране валидация при създаване на продукт** — `handleSubmit` в `ProductsTab` не проверява дали SKU вече съществува. DB няма unique constraint на `sku`.

6. **`useMediaLibrary` — при изтриване на папка, файловете в storage НЕ се изтриват** — `deleteFolder` трие само DB записа (CASCADE на `media_files.folder_id` е `SET NULL`, не DELETE). Файловете остават "осиротели" в storage bucket.

7. **`MediaLibraryTab` — `useEffect` с `media.fetchFolders` без dependency** — `useEffect(() => { media.fetchFolders(); }, [])` — липсва `media.fetchFolders` в dependencies. Работи заради `useCallback` стабилност, но е некоректно.

8. **Console warning** — `ConnectixSettings` подава ref на function component без `forwardRef`. Не е критично, но е грешка.

### C. Проблеми с оптимизацията

9. **Lazy tab loading е имплементиран**, но `useInventory()` в `Inventory.tsx` все още зарежда ВСИЧКО при mount (преди да се избере таб). Lazy tabовете помагат за rendering, но не за data fetching.

10. **Няма виртуализация на таблици** — `@tanstack/react-virtual` е инсталиран, но не се ползва никъде. При 50-100 реда на страница не е критично (пагинацията помага), но MovementsTab и DocumentsTab нямат пагинация.

### D. Липсващи функционалности

11. **Промокодове** — таблицата `promo_codes` е създадена, но няма UI за управление.
12. **Няма експорт от Медия библиотеката** (download).
13. **Няма масово качване с progress bar** в медията.

---

## План за корекции (по приоритет)

### 1. Рефакториране на `useInventory` — спиране на масовото зареждане
- Премахване на `fetchProducts()` от `fetchAll()` — ProductsTab вече ползва `useProductsPage`.
- Dashboard статистики — нова DB функция `get_inventory_stats()` (server-side COUNT/SUM), вместо client-side.
- `fetchMovements()` и `fetchDocuments()` — добавяне на сървърна пагинация.
- `fetchSuppliers()`, `fetchCategories()`, `fetchUnits()` — OK (обикновено < 100 реда).
- `fetchBatches()` — добавяне на limit.

### 2. Сървърна пагинация за MovementsTab и DocumentsTab
- Нови hooks `useMovementsPage` и `useDocumentsPage` по модела на `useProductsPage`.
- Сървърно търсене и сортиране.

### 3. Dashboard статистики — server-side
- SQL функция `get_inventory_stats()` връщаща `totalProducts`, `activeProducts`, `lowStockCount`, `outOfStockCount`, `totalStockValue`, `totalSaleValue`.
- `InventoryDashboard` извиква RPC вместо client-side изчисления.
- `criticalStockInfo` в `Inventory.tsx` — също от RPC.

### 4. SKU unique constraint + валидация
- DB миграция: `ALTER TABLE inventory_products ADD CONSTRAINT unique_sku UNIQUE (sku);`
- UI: проверка при submit за дублиран SKU.

### 5. Медия — fix при изтриване на папка
- При `deleteFolder`: първо fetch файловете в папката, изтрий ги от storage, после от DB.

### 6. ConnectixSettings forwardRef fix
- Минимална корекция на ref warning.

### 7. Download бутон в медия библиотеката
- Добавяне на "Изтегли" опция в контекстното меню на файловете.

---

## Файлове за промяна

| Файл | Промяна |
|---|---|
| SQL миграция | `get_inventory_stats()` RPC + SKU unique constraint |
| `src/hooks/useInventory.tsx` | Премахване на `fetchProducts()` от `fetchAll()`, лимити |
| `src/hooks/useMovementsPage.tsx` | Нов hook с пагинация |
| `src/hooks/useDocumentsPage.tsx` | Нов hook с пагинация |
| `src/components/inventory/InventoryDashboard.tsx` | RPC вместо client-side stats |
| `src/components/inventory/MovementsTab.tsx` | Ползване на `useMovementsPage` |
| `src/components/inventory/DocumentsTab.tsx` | Ползване на `useDocumentsPage` |
| `src/components/inventory/MediaLibraryTab.tsx` | Download бутон, fix dependencies |
| `src/hooks/useMediaLibrary.tsx` | Fix deleteFolder |
| `src/pages/Inventory.tsx` | RPC за criticalStockInfo |
| `src/components/settings/ConnectixSettings.tsx` | forwardRef fix |

Общо: ~1 SQL миграция, 2 нови файла, ~8 модифицирани файла.


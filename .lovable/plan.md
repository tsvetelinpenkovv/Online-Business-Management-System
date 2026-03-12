

# Пълен QA одит на складовата програма

---

## A. Test Plan — Обхват на тестването

| Категория | Обхванати компоненти |
|---|---|
| CRUD Продукти | ProductsTab, useInventory, useProductsPage |
| CRUD Доставчици | SuppliersTab, useInventory |
| CRUD Категории | CategoriesTab, useInventory |
| Документи (Вход/Изход) | DocumentsTab, createStockDocument |
| Движения на стоки | MovementsTab, createStockMovement |
| Трансфери между складове | StockTransferDialog |
| Изчисления и KPI | InventoryDashboard, WarehouseKPIDashboard, ProfitabilityReport |
| Inline редакция на наличност | InlineStockEditor |
| Прогнози | ForecastTab |
| Одит лог | AuditLogTab, useAuditLog |
| Валидации | Форми за продукти, документи, доставчици |
| Сигурност | RLS политики, permission checks |
| UI/UX | Mobile/Desktop, модали, пагинация |

---

## B. Test Scenarios & Findings

### TS-001: Създаване на продукт — Липса на валидация за дублиран SKU
- **Предпоставки**: Съществува продукт с SKU "PROD-001"
- **Стъпки**: Опит за създаване на нов продукт със същото SKU
- **Очакван резултат**: Грешка "Този код вече съществува"
- **Реален резултат**: Формата изпраща заявката, DB може да приеме или откаже (зависи от unique constraint). Липсва client-side валидация.
- **Статус**: ⚠️ Warning

### TS-002: Създаване на продукт с начална наличност — Race condition
- **Стъпки**: Създаване на продукт с current_stock = 50
- **Код**: `createProduct` → после `updateProduct(result.id, { current_stock: 50 })`
- **Очакван резултат**: Продукт с наличност 50, записана чрез stock movement
- **Реален резултат**: Наличността се задава директно с `updateProduct`, **без да се създава stock movement**. Това означава, че историята на движенията няма запис за тази начална наличност. Тригерът `update_product_stock` се задейства само при INSERT в `stock_movements`.
- **Статус**: 🔴 **FAIL — Critical**

### TS-003: Изписване на стока над наличното количество
- **Стъпки**: Продукт с наличност 5, създаване на dispatch документ с количество 10
- **Очакван резултат**: Грешка или предупреждение
- **Реален резултат**: Системата позволява операцията. В `createStockMovement`, `stockAfter = stockBefore - quantity` може да стане отрицателно. Няма проверка `if (stockAfter < 0)`.
- **Статус**: 🔴 **FAIL — Critical**

### TS-004: Adjustment движение — Неправилно изчисление на quantity
- **Код (ред 221-223 в useInventory)**: При adjustment, `quantity` се записва като `Math.abs(quantity - stockBefore)`, но `stock_after = quantity` (параметърът). Ако стокът е 10 и правим adjustment на 15, се записва quantity=5, stock_after=15. Ако стокът е 10 и правим adjustment на 3, се записва quantity=7, stock_after=3.
- **Проблем**: Тригерът `update_product_stock` за adjustment задава `current_stock = NEW.stock_after`. Но movement_type може да не съвпада с визуалната логика — записаното quantity не показва посока (увеличение или намаление).
- **Статус**: ⚠️ Warning — Работи, но movement записът не дава ясна информация за посоката

### TS-005: Трансфер между складове — Невалиден movement_type
- **Код (StockTransferDialog, ред 132-151)**: Използва `movement_type: 'transfer'`, но DB enum е `('in', 'out', 'adjustment', 'return')`. Типът 'transfer' **не съществува** в enum-a.
- **Очакван резултат**: Успешен трансфер
- **Реален резултат**: **INSERT ще FAIL-не** с DB error, защото 'transfer' не е валидна стойност за enum `movement_type`.
- **Статус**: 🔴 **FAIL — Critical**

### TS-006: Трансфер — Не проверява наличност по склад
- **Код (StockTransferDialog, ред 62)**: `maxQuantity = selectedProductData?.current_stock || 0` — проверява **глобалната** наличност, не наличността в конкретния изходен склад.
- **Очакван резултат**: Да проверява наличност в конкретния склад
- **Реален резултат**: Може да трансферира повече отколкото има в конкретния склад
- **Статус**: 🔴 **FAIL — High**

### TS-007: Трансфер — Не намалява source stock_by_warehouse ако няма запис
- **Код (ред 155-167)**: Ако `sourceStock` не съществува в таблицата, просто пропуска намалението. Не създава нов запис с отрицателна стойност и не хвърля грешка.
- **Статус**: ⚠️ Warning

### TS-008: Документ dispatch — Не проверява налична наличност
- **Стъпки**: Създаване на dispatch документ за продукт с наличност 0
- **Очакван резултат**: Блокиране или предупреждение
- **Реален резултат**: Документът се създава, наличността става отрицателна
- **Статус**: 🔴 **FAIL — High**

### TS-009: Валидация на форма за продукт — Липса на trim и length validation
- **Стъпки**: Въвеждане на " " (само интервали) като SKU
- **Очакван резултат**: Грешка
- **Реален резултат**: Бутонът "Създай" е disabled само ако `!formData.sku || !formData.name` — но " " (space) е truthy, така че позволява submit.
- **Статус**: 🔴 **FAIL — Medium**

### TS-010: Цена 0 или отрицателна цена
- **Стъпки**: Създаване на продукт с purchase_price = -5
- **Очакван резултат**: Грешка или блокиране
- **Реален резултат**: HTML input има `min="0"`, но `parseFloat(e.target.value) || 0` — ако потребителят въведе отрицателно число чрез paste, стойността ще бъде приета. Няма server-side валидация.
- **Статус**: ⚠️ Warning

### TS-011: Margin калкулация — Division by zero
- **Код (ред 275-278 в ProductsTab)**: `if (product.purchase_price === 0) return 0;` — Правилно обработва нулева цена.
- **Статус**: ✅ Pass

### TS-012: Стойност на склада — Изчисление
- **Код (useInventory getInventoryStats)**: `totalStockValue = products.reduce((sum, p) => sum + (p.current_stock * p.purchase_price), 0)`
- **Проблем**: Ако `current_stock` е отрицателен (възможно поради TS-003), стойността ще бъде грешна.
- **Статус**: ⚠️ Warning — зависи от TS-003

### TS-013: Пагинация на продукти — Server-side
- **Стъпки**: Навигация между страници
- **Очакван резултат**: Правилно показване на записи
- **Реален резултат**: Работи коректно. `useProductsPage` използва `range(from, to)` с `count: 'exact'`.
- **Статус**: ✅ Pass

### TS-014: Търсене на продукти — SQL injection чрез ilike
- **Код (useProductsPage, ред 35)**: `query.or(\`name.ilike.%${s}%,sku.ilike.%${s}%,barcode.ilike.%${s}%\`)`
- **Проблем**: Стойността `s` се интерполира директно в query string. Supabase JS SDK sanitize-ва параметрите при `.or()`, но **процентни и underscore символи** в ilike не се escape-ват, което може да върне неочаквани резултати (не е SQL injection, но е data leakage).
- **Статус**: ⚠️ Warning — Low risk

### TS-015: Движения — Лимит 100 записа
- **Код (useInventory fetchMovements)**: `limit(100)` — При много движения, потребителят вижда само последните 100. Няма пагинация за движения.
- **Статус**: ⚠️ Warning — Medium, при активна употреба ще липсват записи

### TS-016: Документи — Лимит 100 записа
- **Код (useInventory fetchDocuments)**: `limit(100)` — Същия проблем.
- **Статус**: ⚠️ Warning — Medium

### TS-017: Inline редакция на наличност — Отрицателни стойности
- **Код (InlineStockEditor, ред 41-42)**: `if (isNaN(newValue) || newValue < 0)` — правилно блокира отрицателни стойности.
- **Статус**: ✅ Pass

### TS-018: Изтриване на продукт с движения
- **Стъпки**: Изтриване на продукт, който има записи в stock_movements
- **Очакван резултат**: Грешка или cascade delete
- **Реален резултат**: DB foreign key constraint ще блокира изтриването (ако няма ON DELETE CASCADE). Грешката се показва като generic toast "Неуспешно изтриване на продукт".
- **Статус**: ⚠️ Warning — Грешката не е информативна за потребителя

### TS-019: Документ — Празен submit
- **Код (DocumentsTab, ред 149)**: `items.filter(item => item.productId && item.quantity > 0)` — Ако всички items са празни, `validItems` е празен масив, функцията return-ва без действие. Бутонът е disabled когато няма валидни items.
- **Статус**: ✅ Pass

### TS-020: Двоен submit при създаване на документ
- **Стъпки**: Бързо двойно кликване на "Създай документ"
- **Очакван резултат**: Един документ
- **Реален резултат**: Бутонът **не** се disable-ва по време на submit (липсва `isSubmitting` state в DocumentsTab). Може да се създадат 2 документа.
- **Статус**: 🔴 **FAIL — High**

### TS-021: Двоен submit при създаване на продукт
- **Стъпки**: Бързо двойно кликване на "Създай"
- **Очакван резултат**: Един продукт
- **Реален резултат**: Същият проблем — бутонът не се disable-ва при submit.
- **Статус**: 🔴 **FAIL — High**

### TS-022: Двоен submit при inline stock save
- **Код (InlineStockEditor)**: Има `saving` state, бутонът се disable-ва.
- **Статус**: ✅ Pass

### TS-023: RLS политики — Consistency check
- Всички inventory таблици използват `is_allowed_user` за SELECT и `has_permission` за INSERT/UPDATE/DELETE. Это консистентно.
- **Статус**: ✅ Pass

### TS-024: Audit log — Не се записва автоматично
- **Код (useAuditLog)**: `logAction` трябва да се извиква ръчно. В `useInventory` **не се извиква** `logAction` никъде — нито при createProduct, нито при updateProduct, нито при deleteProduct, нито при createStockMovement.
- **Очакван резултат**: Всяка промяна да се логва
- **Реален резултат**: Audit log-ът **не** записва складови операции автоматично. Логването зависи изцяло от ръчни извиквания в компонентите.
- **Статус**: 🔴 **FAIL — High** — Одит логът е празен за складови операции

### TS-025: Потенциална печалба — Изчисление
- **Код**: `potentialProfit = totalSaleValue - totalStockValue` = `Σ(current_stock * sale_price) - Σ(current_stock * purchase_price)`
- **Проверка**: За продукт с purchase=10€, sale=15€, stock=100: (100*15)-(100*10) = 500€. Коректно.
- **Статус**: ✅ Pass

### TS-026: Bundle deduction trigger — Потенциална рекурсия
- **Код (deduct_bundle_components trigger)**: При OUT движение на bundle, създава нови OUT движения за компонентите. Тези нови движения ще задействат тригера `update_product_stock`, но и самият `deduct_bundle_components`. Ако компонент също е bundle, може да има рекурсия.
- **Статус**: ⚠️ Warning — Potential recursive trigger при nested bundles

### TS-027: Количество в документ — Десетични стойности
- **Код (DocumentsTab, ред 435)**: `min="0.001" step="0.001"` — Позволява десетични количества. Добре.
- **Статус**: ✅ Pass

### TS-028: Mobile UI — Responsive layout
- Проверен код: Всички табове имат `isMobile` check с Card layout за мобилни и Table за desktop.
- **Статус**: ✅ Pass

### TS-029: Reserved stock — Type safety
- **Код**: Навсякъде `(product as any).reserved_stock` — полето `reserved_stock` не е в TypeScript типа `InventoryProduct`. Ако колоната не съществува в DB, ще бъде `undefined`, и `> 0` ще е false. Работи, но е type-unsafe.
- **Статус**: ⚠️ Warning — Type safety issue

### TS-030: XSS при product name
- Не се използва `dangerouslySetInnerHTML`. React автоматично escape-ва. 
- **Статус**: ✅ Pass

---

## C. Bug Report — Сортирани по тежест

### BUG-001: Трансфер — Невалиден movement_type 'transfer'
- **Тежест**: 🔴 Critical
- **Приоритет**: P0
- **Стъпки**: Активирайте мулти-склад → Опитайте трансфер
- **Очакван**: Успешен трансфер
- **Реален**: DB error — 'transfer' не е валидна стойност за enum
- **Причина**: StockTransferDialog използва `movement_type: 'transfer'`, но enum-ът е `('in', 'out', 'adjustment', 'return')`
- **Препоръка**: Добавете 'transfer' към enum чрез миграция, или използвайте 'out'/'in' за двете посоки

### BUG-002: Изписване над наличното количество е позволено
- **Тежест**: 🔴 Critical
- **Приоритет**: P0
- **Стъпки**: Създайте dispatch документ с количество > наличното
- **Очакван**: Грешка
- **Реален**: Наличността става отрицателна
- **Причина**: Липсва проверка в `createStockMovement` и `createStockDocument`
- **Препоръка**: Добавете `if (movementType === 'out' && stockAfter < 0)` проверка

### BUG-003: Начална наличност при нов продукт не създава движение
- **Тежест**: 🔴 Critical
- **Приоритет**: P1
- **Стъпки**: Създайте продукт с количество 50
- **Очакван**: Movement запис за начална наличност
- **Реален**: Директен UPDATE без movement — историята е непълна
- **Причина**: `handleSubmit` в ProductsTab използва `updateProduct` вместо `createStockMovement`
- **Препоръка**: Използвайте `createStockMovement('in', ...)` за началната наличност

### BUG-004: Двоен submit при създаване на документи
- **Тежест**: 🔴 High
- **Приоритет**: P1
- **Стъпки**: Бързо двойно кликване на "Създай документ"
- **Очакван**: Един документ
- **Реален**: Два документа
- **Причина**: Липсва `isSubmitting` state в DocumentsTab
- **Препоръка**: Добавете `isSubmitting` flag и disable на бутона

### BUG-005: Двоен submit при създаване на продукт
- **Тежест**: 🔴 High
- **Приоритет**: P1
- **Стъпки**: Бързо двойно кликване на "Създай"
- **Очакван**: Един продукт
- **Реален**: Два продукта
- **Причина**: Липсва loading state на submit бутона в ProductsTab
- **Препоръка**: Добавете `isSubmitting` flag

### BUG-006: Audit log не записва складови операции
- **Тежест**: 🔴 High
- **Приоритет**: P1
- **Стъпки**: Създайте/редактирайте/изтрийте продукт → Проверете одит лога
- **Очакван**: Запис в одит лога
- **Реален**: Празен одит лог за складови операции
- **Причина**: `useInventory` не извиква `logAction` от `useAuditLog`
- **Препоръка**: Интегрирайте audit logging в CRUD операциите или използвайте DB triggers

### BUG-007: Трансфер проверява глобална наличност вместо наличност по склад
- **Тежест**: 🔴 High
- **Приоритет**: P2
- **Стъпки**: Продукт с 10 бр. общо, 3 бр. в склад А → трансфер на 8 от склад А
- **Очакван**: Грешка — няма достатъчно в склад А
- **Реален**: Позволява трансфера
- **Причина**: `maxQuantity = selectedProductData?.current_stock` (глобална наличност)
- **Препоръка**: Query-вайте `stock_by_warehouse` за конкретния склад

### BUG-008: Валидация — SKU с интервали е допустим
- **Тежест**: Medium
- **Приоритет**: P2
- **Причина**: Липсва `.trim()` при проверка на SKU и name
- **Препоръка**: `formData.sku.trim()` при submit и при disabled check

### BUG-009: Движения и документи ограничени до 100 записа без пагинация
- **Тежест**: Medium
- **Приоритет**: P2
- **Причина**: Hardcoded `limit(100)` без пагинация UI
- **Препоръка**: Добавете пагинация за MovementsTab и DocumentsTab, подобно на ProductsTab

### BUG-010: `reserved_stock` не е в TypeScript типа InventoryProduct
- **Тежест**: Low
- **Приоритет**: P3
- **Причина**: Полето се cast-ва чрез `(product as any).reserved_stock`
- **Препоръка**: Добавете `reserved_stock: number` в интерфейса InventoryProduct

---

## D. Coverage Report

### Тествано ✅
- CRUD продукти — форма, submit, валидация на бутон
- CRUD доставчици — базова структура
- CRUD категории — базова структура
- Документи — създаване, filтриране, сортиране
- Движения — визуализация, филтриране, сортиране
- Inline stock editor — валидация, save/cancel
- Dashboard KPI — изчисления
- Пагинация на продукти (server-side)
- Търсене (server-side)
- RLS политики — consistency
- Mobile responsive layout
- XSS защита
- Permission checks (canCreate, canEdit, canDelete)
- Bundle components view

### Не е тествано / Частично ⚠️
- Импорт/Експорт (ImportExportDialog) — не е прегледан код
- Баркод сканиране — зависи от hardware
- Масова промяна на цени (BulkPriceChangeDialog)
- Инвентаризация (ScheduledRevisionDialog)
- Серийни номера (SerialNumbersTab)
- WooCommerce синхронизация
- Concurrent operations (race conditions при паралелни потребители)
- Performance с 10,000+ продукта (server-side pagination покрива, но movements/documents не)
- Network failure recovery
- Browser back/forward behavior

### Рискови зони 🔴
1. **Stock integrity** — отрицателни наличности са възможни
2. **Transfer functionality** — напълно счупена (невалиден enum)
3. **Audit trail** — не работи за складови операции
4. **Double submit** — документи и продукти могат да се дублират
5. **Data consistency** — начална наличност не се записва в историята

---

## E. Final Verdict

### Готово ли е за production?
**НЕ** — системата има 3 critical и 4 high severity бъга, които трябва да се оправят преди реална употреба.

### Оценка на надеждността: **5 / 10**

### Основни рискове
1. **Data integrity**: Наличностите могат да станат отрицателни, трансферите не работят, историята е непълна
2. **Audit compliance**: Одит логът не записва складови операции
3. **Double submit**: Възможно дублиране на документи и продукти

### Какво трябва да се оправи ПЪРВО (P0)
1. Поправете трансфер movement_type enum
2. Добавете проверка за отрицателна наличност при изписване
3. Създавайте stock movement за начална наличност

### Задължително преди production
1. Всички P0 и P1 бъгове
2. Пагинация за движения и документи
3. Интеграция на audit logging
4. Double-submit protection на всички форми
5. Trim валидация на SKU/name полета

### Препоръчителни подобрения
- Добавете DB constraint за non-negative stock
- Server-side валидация чрез DB triggers или edge functions за stock overflow
- Добавете confirmation dialog при dispatch на повече от 80% от наличността
- Добавете `reserved_stock` в TypeScript типа
- Escape-ване на `%` и `_` при ilike search


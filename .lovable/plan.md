

# План: Източници, дефолтна страница, масов импорт и подобрения

## 1. WooCommerce да се скрива от източниците когато е изключен

**Проблем**: В `AddOrderDialog.tsx` и навсякъде, където се показват източниците, WooCommerce (и другите платформи) се филтрират само по `is_enabled`, но в `SourceSettings.tsx` винаги се показват всички платформи с toggle. Проблемът е, че при нулиране WooCommerce се деактивира, но все пак се показва в dropdown-а за избор на източник при добавяне на поръчка.

**Решение**: В `AddOrderDialog.tsx` вече се филтрира по `platforms.filter(p => p.is_enabled)` — ще проверя и потвърдя, че това работи коректно. Ако не, ще го оправя.

## 2. Дефолтна начална страница (Поръчки vs Склад)

**Промени**:

| Файл | Промяна |
|------|---------|
| DB: `company_settings` | Нова колона `default_landing_page` (text, default `'orders'`) |
| `src/pages/Settings.tsx` | Нова секция "Дефолтни настройки" с dropdown за избор: Поръчки / Склад |
| `src/pages/Index.tsx` | При login проверка на `default_landing_page` — ако е `'inventory'`, redirect към `/inventory` |
| `src/pages/Inventory.tsx` | Бутон "Поръчки" в header-а (вече има "← Поръчки", ще остане) |
| `src/pages/Index.tsx` | Бутон "Склад" в header-а (вече има такъв) |

При `default_landing_page = 'inventory'`:
- Login redirect → `/inventory`
- Inventory header показва бутон "Поръчки"

При `default_landing_page = 'orders'` (default):
- Login redirect → `/` (поръчки)
- Orders header показва бутон "Склад"

## 3. Масов импорт за всички модули

**Текущо състояние**: `ImportExportDialog.tsx` вече поддържа импорт/експорт за products, suppliers, categories, documents и revision. Липсват: движения (movements), цени (prices), складове (warehouses).

**Промени**:

| Файл | Промяна |
|------|---------|
| `src/components/inventory/ImportExportDialog.tsx` | Добавяне на типове `movements`, `prices`, `warehouses` с field definitions, templates и import логика |

Нови шаблони:
- **Движения**: SKU, Тип (вход/изход/корекция), Количество, Цена, Причина
- **Цени**: SKU, Покупна цена, Продажна цена
- **Складове**: Код, Име, Адрес, Град, Телефон

Всеки таб в Inventory ще има бутон за импорт/експорт.

## 4. Масови действия за всеки таб

Всеки таб вече има таблица. Ще добавя:
- Checkbox за избор на редове
- Toolbar с масови действия (изтриване, промяна на статус, експорт на избрани)

**Файлове за промяна**:
- `ProductsTab.tsx` — масово изтриване, деактивиране, експорт (частично вече има)
- `SuppliersTab.tsx` — масово изтриване, деактивиране
- `CategoriesTab.tsx` — масово изтриване
- `DocumentsTab.tsx` — масов експорт
- `MovementsTab.tsx` — масов експорт
- `PriceHistoryTab.tsx` — масов експорт
- `WarehouseSettings.tsx` — масово деактивиране

## 5. Отговор на въпроса за нужни функционалности

Ще отговоря в текст, няма нужда от код промени за тази точка.

---

## Обобщение на файлове за редакция

| # | Файл | Промяна |
|---|------|---------|
| 1 | DB migration | Нова колона `default_landing_page` в `company_settings` |
| 2 | `src/pages/Settings.tsx` | Секция "Дефолтни настройки" |
| 3 | `src/pages/Index.tsx` | Redirect логика при login |
| 4 | `src/components/inventory/ImportExportDialog.tsx` | Нови типове за импорт: movements, prices, warehouses |
| 5 | `src/components/inventory/ProductsTab.tsx` | Масови действия с checkboxes |
| 6 | `src/components/inventory/SuppliersTab.tsx` | Масови действия |
| 7 | `src/components/inventory/CategoriesTab.tsx` | Масови действия |
| 8 | `src/components/inventory/DocumentsTab.tsx` | Масови действия + импорт бутон |
| 9 | `src/components/inventory/MovementsTab.tsx` | Масови действия + импорт бутон |
| 10 | `src/components/inventory/PriceHistoryTab.tsx` | Масови действия + импорт бутон |
| 11 | `src/components/inventory/ReportsTab.tsx` | Експорт бутон |
| 12 | `src/components/inventory/WarehouseSettings.tsx` | Масови действия + импорт |

## Какво е критично нужно за уникална складова система

Системата вече покрива основните модули. Ето какво би я направило наистина мощна:

1. **Масов импорт** (включено в този план) — без него зареждането на стотици артикули е невъзможно
2. **Дефолтна страница** (включено) — удобство за складови оператори
3. **Баркод скенер от камера** — вече има диалог, може да се разшири
4. **Автоматични поръчки към доставчици** — при нисък stock, генериране на заявка
5. **FEFO/FIFO логика за партиди** — изписване по срок на годност (вече има batches)
6. **Серийни номера** — проследяване на всеки отделен артикул
7. **Инвентаризация с баркод** — бързо сканиране и сравнение с реалния stock

Ще се фокусирам върху точки 1-4 от плана (масов импорт, дефолтна страница, масови действия, WooCommerce филтриране).


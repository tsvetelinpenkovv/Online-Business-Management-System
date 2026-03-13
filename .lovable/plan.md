

# Анализ на 3-те въпроса от клиента и план за доработки

## 1. E2E тест на новите модули

Прегледах кода на всички нови/модифицирани компоненти. Ето статуса:

| Модул | Статус | Бележки |
|---|---|---|
| **Медия библиотека** (`MediaLibraryTab`) | ✅ Работи | Папки, качване, drag&drop, download, преместване, изтриване — всичко е свързано |
| **InventoryDashboard** (RPC) | ✅ Работи | Ползва `get_inventory_stats()` RPC, не зарежда всички продукти |
| **MovementsTab** (пагинация) | ✅ Работи | Ползва `useMovementsPage` със сървърна пагинация |
| **DocumentsTab** (пагинация) | ✅ Работи | Ползва `useDocumentsPage` |
| **Метод на плащане** | ✅ Работи | Dropdown в AddOrderDialog/EditOrderDialog + филтър |
| **Еконт автоматично проследяване** | ✅ Работи | Edge function + cron + UI в CourierSettings |
| **useInventory рефактор** | ✅ Работи | `fetchAll` вече не зарежда продукти/движения масово |

**Проблем в BarcodeScannerDialog (ред 73):** Търси `inventory.products`, но след рефактора `useInventory` вече не зарежда продуктите. Това означава, че баркод скенерът може да не намира артикули. Трябва да се направи сървърна заявка вместо client-side `find()`.

---

## 2. Връзка с обикновен/custom сайт (различен от WooCommerce, Shopify и т.н.)

**Текущо състояние:** Системата поддържа само 5 фиксирани платформи (WooCommerce, PrestaShop, OpenCart, Magento, Shopify). Няма опция за "Custom/REST API" интеграция.

**Какво ще добавя:**
- Нова платформа **"Потребителски сайт" (Custom API)** в `ecommerce_platforms` таблицата
- Специален webhook endpoint (`custom-webhook`) — приема поръчки от произволен сайт чрез прост JSON формат
- UI в настройките с генериран webhook URL + API ключ за автентикация + документация за формата
- Клиентът дава webhook URL-то на разработчика на сайта си, и сайтът праща поръчките към системата

---

## 3. Сканиране на баркод от камерата на телефона + задаване на количество

**Текущо състояние:** `BarcodeScannerDialog` приема само ръчно въвеждане в текстово поле. Иконата `Camera` е импортирана, но не се ползва. Няма достъп до камерата. Количеството се увеличава с +1/-1, но няма опция за директно въвеждане на число (напр. "20 бройки").

**Какво ще добавя:**
- **Камера сканиране** чрез `navigator.mediaDevices.getUserMedia()` + `BarcodeDetector` API (поддържан в Chrome/Android). Fallback за iOS — ползва `<input type="file" capture="environment">` за заснемане.
- **Директно въвеждане на количество** — вместо само +1/-1, клик върху числото отваря input за директно задаване (напр. 20, 30, 50)
- **Fix на server-side search** — вместо `inventory.products.find()`, баркод скенерът ще прави `supabase.from('inventory_products').select().eq('barcode', code)` заявка

---

## План за имплементация

### A. Fix BarcodeScannerDialog — сървърно търсене + директно количество
- Замяна на `inventory.products.find()` с `supabase.from('inventory_products').select().or('barcode.eq.X,sku.ilike.X')` 
- Input field за количество при всеки сканиран артикул (не само +1/-1)
- Премахване на зависимостта от `inventory` prop (вече не е нужно)

### B. Камера баркод сканиране
- Бутон "Камера" до текстовото поле
- Отваря видео stream от задната камера
- Ползва `BarcodeDetector` API за автоматично разпознаване
- При успех — попълва баркода и го submit-ва автоматично

### C. Custom API платформа
- SQL миграция: INSERT нов ред в `ecommerce_platforms` с `name: 'custom_api'`
- Нова edge function `custom-webhook/index.ts` — приема POST заявки с поръчки от произволен сайт
- UI карта в `PlatformApiSettings` за custom платформата с: webhook URL, API ключ, примерен JSON формат
- Документация вградена в UI-то

### Файлове за промяна:

| Файл | Промяна |
|---|---|
| SQL миграция | Custom API platform + webhook secret |
| `supabase/functions/custom-webhook/index.ts` | Нова edge function за custom сайтове |
| `src/components/inventory/BarcodeScannerDialog.tsx` | Камера + сървърно търсене + директно количество |
| `src/components/settings/PlatformApiSettings.tsx` | UI за custom платформата |
| `src/components/icons/SourceIcon.tsx` | Иконка за custom_api |

Общо: 1 SQL миграция, 1 нова edge function, ~3 модифицирани файла.


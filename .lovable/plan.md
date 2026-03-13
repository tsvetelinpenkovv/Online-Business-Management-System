

# План за 9 задачи: Глобално търсене, масови действия, печат, визуални корекции, документация

## Обхват на задачите

### 1. Глобално търсене (Command Palette)
Бутон с лупа в хедъра на всяка страница. При клик отваря Command Dialog (вече има `cmdk` библиотека) с категории:
- **Навигация**: Поръчки, CRM, Финанси, Аналитика, Склад, Връщания, Съобщения, Настройки
- **Настройки** (всички табове): Фирмени данни, Статуси, Куриери, Платформи, Connectix, Промокодове, Роли...
- **Действия**: Нова поръчка, Нов продукт, Нов клиент, Експорт CSV...

**Нов файл**: `src/components/GlobalSearchDialog.tsx` — ползва `Command` от `src/components/ui/command.tsx`
**Промени**: Добавяне на бутон `Search` в хедъра на всяка страница (Index, CRM, Finance, Analytics, Inventory, Returns, Messages, Nekorekten). Keyboard shortcut `Ctrl+K` / `Cmd+K`.

### 2-3. E2E тест и проверка на модулна свързаност
Ще прегледам чрез код дали всички модули работят коректно:
- Проверка на `useOrders` → `inventory_product_id` връзка
- Проверка на `BarcodeScannerDialog` → сървърно търсене
- Проверка на `PromoCodesSettings` → RLS policies
- Проверка на `SupplierProductsTab` → таблица и CRUD
- Проверка на `BulkInvoiceExport` → jsPDF генериране
- Проверка на `custom-webhook` → edge function
- Проверка на `track-shipments-auto` → cron

### 4. Системна готовност
Доклад за готовността на всеки модул — ще го включа в отговора.

### 5. Масови действия + Печат на всяка страница
Страниците, които нямат масови действия и печат:

| Страница | Масови действия | Печат | Нужна промяна |
|----------|----------------|-------|---------------|
| **Поръчки** (Index) | ✅ Има | ✅ Има | — |
| **CRM** | ❌ Няма select/bulk | ❌ Няма print | Добави чекбокси + bulk delete/export + print |
| **Финанси** | ❌ Няма bulk | ❌ Частично | Добави bulk export + print бутон |
| **Аналитика** | N/A (графики) | ❌ Няма print | Добави print бутон (window.print) |
| **Склад** | ✅ Частично (ProductsTab) | ❌ Няма print | Print бутон в хедъра |
| **Връщания** | ❌ Няма bulk | ❌ Няма print | Добави чекбокси + bulk status + print |
| **Съобщения** | ❌ Няма bulk | ❌ Няма print | Print бутон |
| **Некоректен** | ❌ Няма bulk | ❌ Няма print | Print бутон |

**Подход**: Добавям бутон `Printer` в хедъра на всяка страница с `onClick={() => window.print()}` + `@media print` стилове за чист печат. За масови действия — чекбокси + bulk toolbar на CRM и Returns.

### 6. Повторен E2E тест
Код ревю на всички промени.

### 7. Бял фон на стрелки (number input spinners)
Потребителят показва screenshot на `input[type=number]` spinners с бял фон. Това е browser default styling. Нужна е CSS корекция в `index.css`:

```css
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  background: transparent;
  opacity: 1;
}
```

### 8. Визуални проверки и корекции
- Проверка за overflow/scroll issues
- Проверка за dark mode consistency
- Проверка за responsive breakpoints

### 9. Пълна документация v4.0
Пълно пренаписване на `DocumentationTab.tsx` с:
- Всички нови модули (промокодове, доставчикови цени, тегло/размери, custom API, баркод скенер с камера, масов експорт на фактури, автоматично Еконт проследяване)
- Подробно описание на всеки бутон и функция
- Стъпка по стъпка инструкции

---

## Файлове за промяна

| Файл | Промяна |
|------|---------|
| `src/components/GlobalSearchDialog.tsx` | **НОВ** — Command palette с глобално търсене |
| `src/pages/Index.tsx` | Добавяне на Search бутон + Cmd+K |
| `src/pages/CRM.tsx` | Search бутон + чекбокси + bulk actions + print |
| `src/pages/Finance.tsx` | Search бутон + print бутон |
| `src/pages/Analytics.tsx` | Search бутон + print бутон |
| `src/pages/Inventory.tsx` | Search бутон + print бутон |
| `src/pages/Returns.tsx` | Search бутон + чекбокси + bulk actions + print |
| `src/pages/Messages.tsx` | Search бутон + print бутон |
| `src/pages/Nekorekten.tsx` | Search бутон + print бутон |
| `src/index.css` | CSS fix за number input spinners + print styles |
| `src/components/settings/DocumentationTab.tsx` | Пълно пренаписване на документацията v4.0 |

**Общо**: 1 нов файл, ~10 модифицирани файла.


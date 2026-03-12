

# План: Превод на всички английски текстове на български

## Обхват на промените

Идентифицирах всички места в системата, където има английски текст видим за потребителя. Техническите термини (API Key, Consumer Key, OAuth, SKU, WooCommerce, CSS, JavaScript, HTML) ще бъдат запазени, тъй като са индустриални стандарти.

## Промени по файлове

### 1. `index.html`
- `lang="en"` → `lang="bg"`

### 2. `src/components/settings/SiteCustomizationTab.tsx`
- `"Safe Mode активен"` → `"Безопасен режим е активен"`
- `"Custom CSS"` → `"Потребителски CSS"`
- `"Custom JavaScript & HTML"` → `"Потребителски JavaScript и HTML"`

### 3. `src/components/settings/CustomCSSEditor.tsx`
- `"Custom CSS"` (заглавие) → `"Потребителски CSS"`

### 4. `src/components/settings/CustomCodeEditor.tsx`
- `"Custom JavaScript"` → `"Потребителски JavaScript"`
- `"Custom HTML (Head)"` → `"Потребителски HTML (Head)"`
- `"Custom HTML (Body)"` → `"Потребителски HTML (Body)"`
- `"Запази HTML Head"` → `"Запази HTML за Head"`
- `"Запази HTML Body"` → `"Запази HTML за Body"`

### 5. `src/components/settings/CourierApiSettings.tsx`
- `"Client ID"` → `"Клиентски идентификатор (Client ID)"`
- `"Client Secret"` → `"Клиентска тайна (Client Secret)"`
- `"API Key"` → `"API Ключ"`
- `"OAuth Client ID"` (placeholder) → `"Въведете Client ID"`
- `"OAuth Client Secret"` (placeholder) → `"Въведете Client Secret"`

### 6. `src/components/settings/MultiStoreSettings.tsx`
- `"Consumer Key"` → `"Потребителски ключ (Consumer Key)"`
- `"Consumer Secret"` → `"Потребителска тайна (Consumer Secret)"`
- `"Webhook Secret"` → `"Тайна за Webhook"`
- `"webhook secret..."` (placeholder) → `"Въведете Webhook тайна..."`

### 7. `src/components/inventory/WooCommerceSettings.tsx`
- `"Consumer Key"` → `"Потребителски ключ (Consumer Key)"`
- `"Consumer Secret"` → `"Потребителска тайна (Consumer Secret)"`

### 8. `src/components/inventory/AuditLogTab.tsx`
- `"User Agent:"` → `"Потребителски агент:"`

### 9. `src/components/settings/DocumentationTab.tsx`
- `"Статуси: Pending, Sent, Delivered, Read, Failed"` → `"Статуси: Изчакващо, Изпратено, Доставено, Прочетено, Неуспешно"`
- `"14. Edge Functions"` → `"14. Сървърни функции"`
- В sections масива: `description: 'Куриери, webhooks, синхронизация, auth'` → `description: 'Куриери, уебхукове, синхронизация, автентикация'`
- `"Edge Functions": Deno` → `"Сървърни функции: Deno"`

### 10. `src/components/settings/PlatformApiSettings.tsx`
- `"Consumer Key"` → `"Потребителски ключ (Consumer Key)"`
- `"Consumer Secret"` → `"Потребителска тайна (Consumer Secret)"`
- `"API Username"` → `"API Потребител"`
- `"API Key"` → `"API Ключ"`
- `"API Secret Key"` → `"API Таен ключ"`
- `"Webhook URL (за автоматични поръчки)"` — вече е на български, OK

### 11. `src/components/settings/ConnectixSettings.tsx`
- `"Sandbox режим"` → `"Демо режим"`

### 12. `src/components/inventory/ProductDetailDialog.tsx`
- `"WooCommerce ID:"` — техническо, запазва се

**Общо ~12 файла с промени, предимно labels за технически полета и няколко UI текста.**


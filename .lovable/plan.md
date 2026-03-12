

# План: Пълно нулиране + дефолтни източници и модули

## Какво ще се промени

### 1. FactoryResetDialog — разширяване на нулирането
При фабрично нулиране (когато е избрано "всичко"):
- **Ecommerce платформи**: Вместо да ги изтрива, ще ги **деактивира** (`is_enabled = false`) — WooCommerce, OpenCart, Shopify, PrestaShop, Magento
- **Магазини**: Вместо да ги изтрива, ще ги **деактивира** (`is_enabled = false`) и ще **изключи multi_store_enabled**
- **Некоректен**: Ще запише `nekorekten_enabled = 'false'` в `api_settings`
- **Connectix/Съобщения**: Ще запише `connectix_config` с `is_enabled: false`
- **Connectix съобщения**: Ще изтрие всички записи от `connectix_messages`

### 2. Дефолтно състояние след нулиране
- Източници: само **Телефон**, **Google**, **Facebook** (стандартните, винаги активни)
- Всички ecommerce платформи: **изключени** (toggle off)
- Всички магазини: **изключени** (toggle off), multi-store: **изключен**
- Некоректен: **изключен**
- Connectix/Съобщения: **изключен**

### 3. Файлове за редакция
| Файл | Промяна |
|------|---------|
| `src/components/settings/FactoryResetDialog.tsx` | Добавяне на логика за деактивиране вместо изтриване на платформи/магазини; нулиране на некоректен и connectix |


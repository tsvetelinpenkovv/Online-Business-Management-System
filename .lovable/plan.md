

# Оптимизация на изображения и скорост — Анализ и план

## Какво вече е направено ✅

Системата вече има солидна база от оптимизации:

1. **Code splitting** — всички страници се зареждат с `React.lazy()` + `Suspense`
2. **React Query кеширане** — `staleTime: 2 min`, `gcTime: 10 min`, без refetch on focus
3. **Storage кеширане** — медия файловете се качват с `cacheControl: '31536000'` (1 година)
4. **CDN headers** — конфигурирани `_headers` за Cloudflare с Brotli/Gzip
5. **Thumbnail система** — `product_images` таблица с `thumbnail_url` приоритет
6. **PWA** — `vite-plugin-pwa` за офлайн кеширане на статични активи

## Какво липсва и ще подобрим 🔧

### 1. Клиентска компресия на изображения преди качване
**Проблем**: Снимките се качват в оригиналния си размер (може да са 5-10MB DSLR снимки).
**Решение**: Нова utility функция `compressImage()` — използва Canvas API за resize + WebP конвертиране:
- Максимална ширина/височина: 1920px (за продукти), 800px (за лога)
- Формат: WebP (80% quality) — ~70-80% по-малък от PNG
- Генерира и thumbnail (200px) автоматично

Ще се интегрира във всички upload hooks:
- `useMediaLibrary` → `uploadFiles()`
- `useCompanyLogo` → `uploadLogo()`
- `useLoginBackground` → `uploadBackground()`
- `useFavicon` → `uploadFavicon()`
- `EditableSourceLogo` → `handleFileChange()`

### 2. Lazy loading на изображения
**Проблем**: Всички `<img>` тагове се зареждат веднага.
**Решение**: Добавяне на `loading="lazy"` и `decoding="async"` на всички `<img>` елементи в таблици и списъци.

### 3. Мемоизация на тежки компоненти
**Проблем**: Recharts графиките се преизчисляват при всеки ре-рендер.
**Решение**: `React.memo()` обвивки на chart компонентите в Analytics.

---

## Файлове за промяна

| Файл | Промяна |
|------|---------|
| `src/lib/imageUtils.ts` | **НОВ** — `compressImage()` и `generateThumbnail()` функции |
| `src/hooks/useMediaLibrary.tsx` | Интеграция на компресия преди upload |
| `src/hooks/useCompanyLogo.tsx` | Компресия преди upload |
| `src/hooks/useLoginBackground.tsx` | Компресия преди upload |
| `src/hooks/useFavicon.tsx` | Компресия преди upload (по-малък resize) |
| `src/components/settings/EditableSourceLogo.tsx` | Компресия преди upload |
| `src/components/inventory/ProductsTab.tsx` | `loading="lazy"` на product images |
| `src/components/orders/OrdersTable.tsx` | `loading="lazy"` на product images |

**Общо**: 1 нов файл, ~7 модифицирани файла.


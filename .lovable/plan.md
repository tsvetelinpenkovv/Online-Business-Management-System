

# Анализ и план за мащабируемост, медия библиотека и оптимизация

## 1. Оценка на готовността за мащаб (100K продукта, 200K клиенти, 1M поръчки, 250K промокода)

### Какво вече е добре:
- Сървърна пагинация за продукти (`useProductsPage`) и поръчки (`useOrders`) с `count: 'exact'` и `range()`
- Над 30 индекса + pg_trgm за бързо търсене
- React Query с `staleTime: 2 min`, `gcTime: 10 min`
- Lazy loading на всички страници
- Database triggers за автоматичен stock update

### Какво липсва или е проблем:
- **`useInventory` зарежда ВСИЧКИ продукти/доставчици/документи/движения/партиди наведнъж** — при 100K продукта това ще убие приложението. `fetchProducts()` няма лимит и пагинация, `fetchMovements()` има limit 100, но останалите — не.
- **Няма виртуализация на таблиците** — `@tanstack/react-virtual` е инсталиран, но не се ползва никъде.
- **Няма таблица за промокодове** — трябва да се създаде.
- **`useInventory` се ползва като "god hook"** — зарежда всичко при mount, дори ако потребителят вижда само таблото.
- Supabase има лимит 1000 реда по подразбиране — някои заявки може мълчаливо да отрязват данни.

### Какво ще направя:
- **Рефакторирам `useInventory`** — премахвам масовото зареждане на продукти (вече има `useProductsPage` за това). Добавям пагинация за движения и документи.
- Добавям **database индекси** за полета, които още не са индексирани (customers.phone, orders.created_at, stock_movements.created_at).
- Създавам **таблица `promo_codes`** с правилни RLS политики и индекси.
- Добавям **виртуализация** на ключовите таблици (ProductsTab, OrdersTable).

## 2. Медия библиотека (нов раздел "Медия")

### Архитектура:
- Нова таблица **`media_files`** — съхранява метаданни за всеки качен файл (име, път в storage, размер, тип, папка, product_id ако е свързан, created_at).
- Нов storage bucket **`media`** (публичен) за ръчно качени файлове.
- Вече съществуващият `product-images` bucket продължава да се ползва за продуктови снимки.
- Нов таблица **`media_folders`** — папки за организация (име, parent_id за вложени папки).
- При качване на продуктова снимка — автоматично се записва и в `media_files` с `product_id`.
- При изтриване на продукт — снимките остават в `media_files` (маркират се като "осиротели"), освен ако потребителят изрично не ги изтрие.

### UI:
- Нов таб **"Медия"** в Склад (до Серийни номера) с иконка Image.
- Компонент `MediaLibrary`:
  - Ляв панел: дървовидна структура на папки + "Всички файлове" + "Продуктови снимки".
  - Десен панел: grid/list изглед на снимки с preview, име, размер, дата.
  - Drag & drop зона за качване.
  - Бутон "Нова папка".
  - Контекстно меню: преглед, преместване в папка, изтриване.
  - Пагинация (сървърна).

### Таблици (SQL):

```sql
-- media_folders
CREATE TABLE public.media_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  parent_id uuid REFERENCES public.media_folders(id) ON DELETE CASCADE,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- media_files
CREATE TABLE public.media_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size integer,
  mime_type text,
  width integer,
  height integer,
  folder_id uuid REFERENCES public.media_folders(id) ON DELETE SET NULL,
  product_id uuid REFERENCES public.inventory_products(id) ON DELETE SET NULL,
  bucket text NOT NULL DEFAULT 'media',
  public_url text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Индекси
CREATE INDEX idx_media_files_folder ON public.media_files(folder_id);
CREATE INDEX idx_media_files_product ON public.media_files(product_id);
CREATE INDEX idx_media_files_created ON public.media_files(created_at DESC);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);
```

RLS: `is_allowed_user` за SELECT, `has_permission('inventory', 'create/edit/delete')` за CUD.

## 3. Допълнителна оптимизация на скоростта

- **Lazy tab loading в Inventory** — табовете `TabsContent` ще се рендират само когато са активни (с `forceMount` само за текущия таб), вместо всички 15+ компонента да се mount-ват.
- **Debounced search** вече е налице — потвърждавам, че работи.
- **React Query prefetch** за следващата страница при пагинация (продукти, поръчки).
- **`useInventory` refactor** — split на отделни hooks за всеки таб (suppliers, documents, movements) вместо един гигантски fetch-all.

## Файлове за промяна/създаване:
1. **SQL миграция**: `media_folders`, `media_files`, `promo_codes` таблици + индекси + RLS + storage bucket.
2. **`src/components/inventory/MediaLibraryTab.tsx`** — нов компонент за медия библиотеката.
3. **`src/hooks/useMediaLibrary.tsx`** — hook за CRUD операции с файлове и папки.
4. **`src/pages/Inventory.tsx`** — добавяне на таб "Медия".
5. **`src/hooks/useInventory.tsx`** — рефакториране: премахване на масовия `fetchProducts()`, добавяне на lazy loading по таб.
6. **Индекси за мащабируемост** — допълнителни DB индекси.

## Обхват на промените:
- ~4 нови файла
- ~3 модифицирани файла
- 1 SQL миграция с 3 нови таблици + индекси + RLS + bucket


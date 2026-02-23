# Build процес: Development vs Production

## Обща информация

Проектът използва **Vite** за build и **Lovable Cloud (Supabase)** за бекенд.  
За да разделите средите (dev/staging/production), трябва да използвате различни `.env` файлове.

---

## Environment Variables

| Променлива | Описание |
|---|---|
| `VITE_SUPABASE_URL` | URL на Supabase проекта |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Публичен (anon) ключ на Supabase |
| `VITE_SUPABASE_PROJECT_ID` | ID на Supabase проекта |

---

## Конфигурация по среда

### Development (Lovable)
Файлът `.env` се генерира автоматично от Lovable Cloud и **не трябва да се редактира ръчно**.

### Production (Hostinger или друг хостинг)

1. **Създайте нов Supabase проект** на [supabase.com](https://supabase.com)
2. **Импортирайте SQL схемата** (вижте `docs/schema-export.sql`)
3. **Създайте `.env.production`** в корена на проекта:

```env
VITE_SUPABASE_URL=https://YOUR-PRODUCTION-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-production-anon-key
VITE_SUPABASE_PROJECT_ID=your-production-project-id
```

---

## Build команди

### За development (локално)
```bash
npm run dev
```
Използва `.env` (или `.env.local`).

### За production build
```bash
# Вариант 1: Ръчно задаване
VITE_SUPABASE_URL=https://prod.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=prod-key \
npm run build

# Вариант 2: С .env.production файл
npm run build
# Vite автоматично зарежда .env.production при `npm run build`
```

### Резултат
Build-ът генерира статични файлове в папка `dist/`, които се качват в `public_html` на Hostinger.

---

## Деплоймънт на Hostinger

1. Изпълнете `npm run build` с production environment variables
2. Качете съдържанието на `dist/` в `public_html/` на Hostinger
3. Уверете се, че `.htaccess` пренасочва всички пътища към `index.html`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

4. Добавете кеширащи хедъри за статични активи:

```apache
<IfModule mod_headers.c>
  # HTML - винаги проверявай за нова версия
  <FilesMatch "\.(html)$">
    Header set Cache-Control "no-cache, must-revalidate"
  </FilesMatch>
  
  # JS/CSS с хеш в името - дългосрочен кеш
  <FilesMatch "\.(js|css)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  
  # Изображения
  <FilesMatch "\.(png|jpg|jpeg|gif|webp|svg|ico)$">
    Header set Cache-Control "public, max-age=604800"
  </FilesMatch>
</IfModule>
```

---

## Edge Functions

**Важно:** Edge Functions се деплойват автоматично в Lovable Cloud. За production Supabase проект, трябва да ги деплойнете ръчно:

```bash
# Инсталирайте Supabase CLI
npm install -g supabase

# Линкнете production проекта
supabase link --project-ref YOUR-PRODUCTION-PROJECT-ID

# Деплойнете всички функции
supabase functions deploy

# Или конкретна функция
supabase functions deploy woocommerce-webhook
```

### Secrets за Edge Functions (production)
```bash
supabase secrets set OPENCART_WEBHOOK_SECRET=your-secret
supabase secrets set LOVABLE_API_KEY=your-key
# ... и т.н.
```

---

## Чеклист за production деплоймънт

- [ ] Нов Supabase проект създаден
- [ ] SQL схема импортирана
- [ ] Edge functions деплойнати
- [ ] Secrets конфигурирани в production Supabase
- [ ] `.env.production` създаден с production ключове
- [ ] `npm run build` изпълнен
- [ ] `dist/` качен в Hostinger `public_html/`
- [ ] `.htaccess` конфигуриран за SPA routing
- [ ] WooCommerce webhooks насочени към production Supabase URL
- [ ] Тестван login и основна функционалност

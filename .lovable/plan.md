

# План: Пълен CMS модул за визуално управление от админ панела

## Какво вече имате

Системата разполага с:
- **InterfaceTextEditor** — редакция на 160+ текстови полета и иконки, записвани в `api_settings`
- **GlobalColorPicker** — глобален основен цвят (light/dark mode)
- **Лого / Favicon / Login Background** — качване в storage
- **Company Settings** — фирмени данни, footer текстове, login текстове

## Какво липсва (и ще бъде добавено)

### 1. Custom CSS инжектор
Ново поле в Settings → "Визуализация" таб, където администраторът въвежда произволен CSS. Записва се в `api_settings` с ключ `custom_css`. Инжектира се чрез `<style>` таг в `App.tsx` при зареждане.

### 2. Custom HTML инжектор  
Две полета: `custom_html_head` (за meta тагове, скриптове в `<head>`) и `custom_html_body` (за банери, footer HTML). Head частта се инжектира чрез `document.head.insertAdjacentHTML`, body частта се рендерира като `dangerouslySetInnerHTML` div в layout-а.

### 3. Custom JavaScript/TypeScript инжектор
Поле `custom_js` — администраторът може да добави аналитичен код, tracking pixels, custom логика. Изпълнява се чрез `<script>` таг или `eval` в контролирана sandbox среда. Само за админи.

### 4. Разширен визуален редактор за секции
Нов компонент `SiteCustomizer` с подсекции:
- **Цветове**: Разширение на GlobalColorPicker — secondary, destructive, success, warning, muted, border цветове (не само primary)
- **Типография**: font-family (Google Fonts dropdown), font-size за body/headings, line-height
- **Spacing**: border-radius, padding defaults
- **Бадж стилове**: цвят/фон за всеки статус-бадж

### 5. Layout / секции конфигуратор
- Показване/скриване на footer, sidebar елементи, header елементи
- Промяна на footer текст/линкове (вече съществува, но ще бъде групирано)
- Login страница: background цвят, заглавие, описание (вече съществува)

### 6. Нов таб "Визуализация" в Settings
Обединява всичко визуално на едно място:
- Custom CSS редактор (textarea с monospace font)
- Custom JS редактор
- Custom HTML (head/body)
- Разширена цветова палитра
- Типография настройки
- Badge/Status визуализация

## Техническа архитектура

### Database
Всичко се записва в съществуващата `api_settings` таблица с нови ключове:
- `custom_css`, `custom_js`, `custom_html_head`, `custom_html_body`
- `custom_font_family`, `custom_font_size`, `custom_border_radius`
- `custom_colors_secondary`, `custom_colors_destructive`, `custom_colors_success`, etc.

Не се изисква нова миграция — `api_settings` вече поддържа произволни key-value двойки.

### Нов hook: `useSiteCustomization`
Зарежда всички custom настройки от `api_settings` и ги прилага при mount:
- Инжектира custom CSS в `<style id="custom-css">`
- Инжектира custom JS в `<script>`
- Прилага custom цветове като CSS variables
- Прилага custom font чрез Google Fonts link + CSS variable

### Нов компонент: `SiteCustomizationTab`
Голям таб в Settings с accordion секции:
1. **Custom CSS** — textarea с preview
2. **Custom JavaScript** — textarea (само за админи, warning за сигурност)
3. **Custom HTML** — head и body полета
4. **Разширени цветове** — color pickers за всички CSS variables
5. **Типография** — font selector, size sliders
6. **Badge стилове** — визуален редактор за статус баджове

### Сигурност
- Custom JS/HTML полета са достъпни САМО за админи (проверка през `is_admin`)
- XSS предупреждение при custom HTML/JS
- Custom CSS е относително безопасен и може да е достъпен за потребители с `edit` права на `settings`

## Файлове за създаване/редакция

| Файл | Действие |
|------|----------|
| `src/hooks/useSiteCustomization.tsx` | Нов — hook за зареждане и прилагане на custom стилове |
| `src/components/settings/SiteCustomizationTab.tsx` | Нов — UI за всички визуални настройки |
| `src/components/settings/CustomCSSEditor.tsx` | Нов — CSS редактор с preview |
| `src/components/settings/CustomCodeEditor.tsx` | Нов — JS/HTML редактор |
| `src/components/settings/ExtendedColorPicker.tsx` | Нов — всички CSS variable цветове |
| `src/components/settings/TypographySettings.tsx` | Нов — font/size настройки |
| `src/components/settings/BadgeStyleEditor.tsx` | Нов — визуален редактор за баджове |
| `src/pages/Settings.tsx` | Редакция — добавяне на нов таб "Визуализация" |
| `src/App.tsx` | Редакция — интеграция на `useSiteCustomization` |

## Приоритет на имплементация

1. `useSiteCustomization` hook + инжектиране в App.tsx
2. Custom CSS Editor (най-гъвкавото средство)
3. Разширена цветова палитра
4. Типография
5. Custom JS/HTML
6. Badge стил редактор


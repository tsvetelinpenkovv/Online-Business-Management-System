import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Download, BookOpen, ShoppingCart, Package, 
  MessageCircle, Settings, Users, Truck, Building2, 
  Database, Shield, Layers, BarChart3, Globe, FileDown, Search,
  DollarSign, UserCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';


const documentationContent = `
# СИСТЕМА ЗА УПРАВЛЕНИЕ НА ОНЛАЙН БИЗНЕС
## Пълна документация v3.0

---

## 1. ОБЩ ПРЕГЛЕД

Системата е цялостно решение за управление на онлайн бизнес, включващо:
- Управление на поръчки от различни платформи
- Складово стопанство и инвентар
- Резервация и изписване на наличности
- **CRM модул**: Управление на клиенти, тагове, бележки, автоматично попълване
- **Финансов модул**: Проследяване на плащания, разходи, кредитни известия
- Интеграция с 7 куриерски услуги (Econt, Speedy, Box Now, Sameday, DHL, Evropat, CVC)
- Автоматично създаване на товарителници
- Масово създаване на товарителници
- Търсене на офиси и автомати
- История на ценовите промени
- Автоматични съобщения до клиенти чрез Connectix (Viber/SMS)
- Проверка на клиенти чрез Nekorekten API
- Издаване на фактури
- Синхронизация с e-commerce платформи
- Лизингови статуси за TBI, BNP и UniCredit
- Редактор на интерфейса за персонализация

---

## 2. МОДУЛ "ПОРЪЧКИ" (/)

### 2.1 Преглед на поръчки
- **Таблица с поръчки**: Показва всички поръчки с възможност за сортиране по всяка колона
- **Филтриране**: По статус, източник, дата, куриер, телефон, продукт, каталожен номер
- **Търсене**: Бързо търсене по клиент, телефон, ID и каталожен номер
- **Селекция**: Избор на множество поръчки за групови действия
- **Пагинация**: Страници по 100 поръчки
- **Количество / Наличност**: Обединена колона показваща количеството и наличността

### 2.2 Полета в поръчка
| Поле | Описание |
|------|----------|
| ID | Уникален номер на поръчката |
| Източник | Откъде е дошла поръчката (WooCommerce, Google, Facebook и др.) |
| Дата | Дата и час на създаване |
| Клиент | Име на клиента |
| Коректност | Флаг дали клиентът е коректен (от Nekorekten) |
| Телефон | Телефонен номер с флаг на държава |
| Цена | Обща стойност в EUR |
| Продукт | Име на продукта (поддържа множество продукти) |
| Каталожен номер | SKU/Код на продукта |
| Количество / Наличност | Брой единици и складова наличност |
| Доставка | Адрес за доставка |
| Куриер | Куриерска фирма и товарителница |
| Статус | Текущ статус на поръчката |
| Коментар | Вътрешни бележки (inline поле при липса на коментар) |

### 2.3 Множество продукти в поръчка
Системата поддържа добавяне на множество продукти към една поръчка:
- В "Нова поръчка" и "Редактиране" има бутон "+ Добави продукт"
- Всеки продукт има отделни полета за име, каталожен номер, количество и цена
- Цената се показва в зелен цвят
- Продуктите се показват като списък в таблицата
- При повече от 1 бр. се показва бадж с количеството

### 2.4 Автоматично попълване от CRM
При въвеждане на телефонен номер в "Нова поръчка", системата автоматично:
- Търси клиента в CRM базата
- Попълва име, имейл и адрес за доставка
- Показва предишни поръчки на клиента

### 2.5 Действия с поръчки
- **Редактиране**: Промяна на всички полета включително множество продукти
- **Фактура**: Издаване на фактура за поръчката
- **Печат**: Отпечатване на поръчката
- **Създай товарителница**: Автоматично създаване на товарителница с данни от поръчката
- **Отвори товарителница**: Отваряне на линк за проследяване
- **Viber/SMS**: Изпращане на съобщение до клиента чрез Connectix
- **Проверка в Nekorekten**: Ръчна проверка дали клиентът е коректен
- **Изтриване**: Изтриване на поръчка

### 2.6 Групови действия
- Промяна на статус на множество поръчки
- Изтриване на множество поръчки
- Печат на множество фактури
- Масово създаване на товарителници за избрани поръчки

### 2.7 Статуси на поръчки
Статусите са конфигурируеми и могат да се пренареждат чрез drag & drop.
Примерни статуси: Нова, В обработка, Потвърдена, Изпратена, Доставена, Отказана.

---

## 3. CRM МОДУЛ (/crm) — НОВО!

### 3.1 Какво е CRM?
CRM (Customer Relationship Management) модулът позволява централизирано управление на клиентите.

### 3.2 Клиентска база
- **Автоматично създаване**: Клиенти се създават автоматично от поръчки
- **Синхронизация**: Бутон "Синхронизирай от поръчки" за импорт на съществуващи клиенти
- **Търсене**: По име, телефон, имейл, град
- **Филтриране**: По тагове (VIP, Нов, Проблемен, Лоялен, B2B, Дропшипинг)

### 3.3 Статистики
- **Общ приход**: Сумарна стойност от всички клиенти
- **Средна поръчка**: Средна стойност на поръчка
- **Брой поръчки**: Общ брой поръчки
- **Уникални клиенти**: Брой уникални клиенти

### 3.4 Клиентски детайли
При клик на клиент се отваря детайлен преглед:
- **Контактна информация**: Име, телефон, имейл, адрес, град
- **Тагове**: VIP, Нов, Проблемен, Лоялен, B2B, Дропшипинг
- **История на поръчки**: Всички поръчки на клиента с дата, продукт и стойност
- **Бележки**: Добавяне и преглед на бележки за клиента

### 3.5 Тагове
Поддържани тагове:
| Таг | Описание | Цвят |
|-----|----------|------|
| VIP | Ценен клиент | Жълт |
| Нов | Нов клиент | Зелен |
| Проблемен | Проблемен клиент | Червен |
| Лоялен | Лоялен клиент | Лилав |
| B2B | Бизнес клиент | Син |
| Дропшипинг | Дропшипинг | Бирюзов |

---

## 4. ФИНАНСОВ МОДУЛ (/finance) — НОВО!

### 4.1 Обща информация
Финансовият модул предоставя пълен преглед на приходите, разходите и печалбата.

### 4.2 Финансово табло
- **Общ приход**: Сума от всички платени поръчки
- **Общи разходи**: Сума от всички въведени разходи
- **Нетна печалба**: Приход минус разходи
- **Неплатени**: Обща стойност на неплатени поръчки

### 4.3 Проследяване на плащания
| Статус | Описание |
|--------|----------|
| Платена | Пълно заплатена поръчка |
| Неплатена | Без плащане |
| Частично | Частично платена поръчка |

- **Inline редактиране**: Промяна на статус на плащане директно от таблицата
- **Платена сума**: Въвеждане на конкретната платена сума
- **Метод на плащане**: Наличен, Карта, Банков превод, Наложен платеж
- **Дата на плащане**: Автоматично се записва

### 4.4 Разходи
- **Добавяне на разходи**: Наем, маркетинг, заплати, доставки, софтуер и др.
- **Категории**: Наем, Маркетинг, Заплати, Доставки, Софтуер, Консумативи, Друго
- **Филтриране по дата**: Избор на период за преглед
- **Изтриване**: Премахване на разходи

### 4.5 Кредитни известия
Автоматично генериране на кредитни известия при връщане на поръчка (планирано).

---

## 5. КУРИЕРСКИ ИНТЕГРАЦИИ

### 5.1 Поддържани куриери
| Куриер | Функции | Тип автентикация |
|--------|---------|------------------|
| **Еконт** | Товарителници, офиси, проследяване | Потребител/Парола |
| **Спиди** | Товарителници, офиси, калкулация | Потребител/Парола |
| **Box Now** | Товарителници, автомати | Client ID/Secret |
| **Sameday** | AWB, автомати, проследяване | Потребител/Парола |
| **DHL** | Товарителници, сервизни точки | Потребител/Парола + Account |
| **Европат** | Товарителници, офиси | API Key |
| **CVC** | Товарителници, офиси | Потребител/Парола |

### 5.2 Създаване на товарителница от поръчка
1. Отворете менюто с действия на поръчка (три точки)
2. Изберете "Създай товарителница"
3. Диалогът автоматично попълва данните от поръчката
4. Изберете куриер и тип доставка (адрес или офис)
5. При доставка до офис - използвайте търсенето на офиси
6. Натиснете "Създай товарителница"

### 5.3 Масово създаване на товарителници
1. Изберете множество поръчки чрез чекбоксовете
2. Отворете менюто за печат
3. Изберете "Създай товарителници"
4. Конфигурирайте куриер, подател, тегло и наложен платеж
5. Натиснете бутона за създаване

---

## 6. МОДУЛ "ИНВЕНТАР" (/inventory)

### 6.1 Продукти
- **Списък**: Всички продукти с наличности, цени, категории
- **Inline редактиране на наличност**: Кликнете на бадж с наличността за директна промяна
- **Добавяне**: Нов продукт с всички детайли
- **Редактиране**: Промяна на продукт
- **Баркод скенер**: Бързо търсене по баркод
- **Продуктова детайлна страница**: Статистика по статуси, снимки от WooCommerce

### 6.2 Наличности
- **Наличност**: Текущо количество (лилав бадж)
- **Резервирано**: Резервирано количество (червен бадж)
- **Свободно**: Налично минус резервирано (зелен бадж, жълт при ниска, червен при нула)

### 6.3 Комплекти (Bundles)
Продуктите могат да бъдат комплекти от други продукти.
**ВАЖНО**: Комплектът няма собствена наличност - само компонентите му имат!

### 6.4 Табове в инвентара
- **Табло**: Обща статистика и предупреждения
- **Продукти**: Списък с продукти
- **Доставчици**: Управление на доставчици
- **Категории**: Йерархична структура
- **Документи**: Складови документи
- **Движения**: История на движенията
- **Справки**: Аналитични справки с експорт в PDF, Excel, CSV
- **Прогнози**: Алерти за ниска наличност и изчерпани продукти
- **Цени**: История на ценовите промени
- **Одит лог**: Проследяване на всички действия

---

## 7. МНОГОСКЛАДОВ РЕЖИМ

### 7.1 Активиране
1. Отидете в Настройки → Складове
2. Включете "Многоскладов режим"
3. Добавете складове

### 7.2 Функции
- Управление на наличности в множество локации
- Трансфер на стоки между складове
- Дашборд с графики за разпределение
- Предупреждения за ниски наличности по складове

---

## 7.5. МУЛТИ-МАГАЗИН РЕЖИМ — НОВО!

### 7.5.1 Какво е мулти-магазин?
Мулти-магазин режимът позволява свързване на множество WooCommerce магазини от различни държави (България, Гърция, Румъния, Унгария и др.) към една обща система за управление.

### 7.5.2 Активиране
1. Отидете в Настройки → Магазини
2. Включете "Мулти-магазин режим"
3. Добавете магазин — изберете държава и въведете WooCommerce API ключове

### 7.5.3 Функции
- **Единен склад**: Всички магазини четат наличности от един общ склад. При синхронизация продуктите се обновяват във всички свързани сайтове.
- **Табове по държава**: В страницата с поръчки се появяват табове за всеки магазин с флаг на държавата и брой поръчки.
- **Флагове в таблицата**: Пред номера на всяка поръчка се показва флагът на съответния магазин.
- **Колони per магазин**: Можете да избирате кои колони да виждате за всеки магазин поотделно.
- **Drag & Drop пренареждане**: Подредете магазините в желания ред с drag & drop или стрелки.
- **Автоматична синхронизация**: Настройте автоматично обновяване на наличности при промяна.
- **Sync Stock към WooCommerce**: Може да бъде изключено — наличностите се водят само в системата без изпращане към WooCommerce.
- **Тест на връзката**: Проверете свързаността с всеки магазин преди да запазите.
- **Webhook за всеки магазин**: Всеки магазин получава уникален webhook URL за приемане на поръчки.

### 7.5.4 Как работи синхронизацията на наличности?
1. Системата поддържа **един централен склад** с наличности.
2. При промяна на наличност, тя се синхронизира автоматично (или ръчно) към всички свързани WooCommerce магазини.
3. Поръчки от всеки магазин автоматично приспадат от общия склад.
4. Можете да изключите изпращането на наличности към конкретен магазин, ако желаете.

---

## 8. АВТОМАТИЧНО ПРИСПАДАНЕ НА НАЛИЧНОСТИ

### 8.1 Настройка
1. Отидете в Склад → Настройки
2. Включете "Автоматично управление"
3. Изберете статусите за приспадане, възстановяване и резервация

### 8.2 Как работи?
1. При статус "В обработка" → количеството се резервира
2. При статус "Изпратена" → наличността се приспада физически
3. При статус "Върната" → наличността се възстановява

---

## 9. CONNECTIX ИНТЕГРАЦИЯ (Viber/SMS)

- Изпращане на Viber и SMS съобщения до клиенти
- Статуси: Изчакващо, Изпратено, Доставено, Прочетено, Неуспешно
- Конфигурация в Настройки → Connectix

---

## 10. NEKOREKTEN ИНТЕГРАЦИЯ

Проверка на коректността на клиенти:
- 🟢 Коректен | 🔴 Некоректен | ⚫ Чака | ❓ Няма данни

---

## 11. МОДУЛ "НАСТРОЙКИ" (/settings)

- **Фирмени данни**: Име, ЕИК, ДДС, адрес, банкова информация
- **Статуси**: Конфигуриране с drag & drop пренареждане
- **Куриери**: API настройки за всеки куриер
- **Платформи**: WooCommerce, OpenCart, Shopify, PrestaShop, Magento
- **Източници**: Конфигуриране на източници с лого
- **Connectix**: Viber/SMS настройки
- **Интерфейс**: Персонализация на текстове
- **Глобален цвят**: Акцентен цвят на системата
- **Роли и права**: Конфигуриране на достъп по роли
- **Документация**: Преглед и изтегляне
- **Фабрично нулиране**: Изтриване на данни

---

## 12. АВТЕНТИКАЦИЯ И СИГУРНОСТ

- Вход с email и парола
- Rate limiting на опити за вход
- reCAPTCHA верификация
- Таен път за достъп до системата
- Автоматичен session timeout с предупреждение
- Роли: admin, user, warehouse_worker, order_operator, finance
- Ролеви права по модул

---

## 13. ТЕХНОЛОГИИ

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui
- **Графики**: Recharts
- **Backend**: Lovable Cloud
- **Сървърни функции**: Deno
- **PDF**: jsPDF
- **Excel**: xlsx
- **Маршрутизиране**: React Router DOM v7
- **State**: React Query (TanStack), React hooks

---

## 14. СЪРВЪРНИ ФУНКЦИИ

| Функция | Описание |
|---------|----------|
| courier-econt | Еконт API |
| courier-speedy | Спиди API |
| courier-boxnow | Box Now API |
| courier-sameday | Sameday API |
| courier-dhl | DHL Express API |
| courier-evropat | Европат API |
| courier-cvc | CVC API |
| connectix-send | Viber/SMS съобщения |
| push-order-status | Синхронизация на статуси |
| sync-products | Синхронизация на продукти |
| sync-prices | Синхронизация на цени |
| sync-stock | Синхронизация на наличности |
| sync-categories | Синхронизация на категории |
| woocommerce-webhook | WooCommerce поръчки |
| shopify-webhook | Shopify поръчки |
| opencart-webhook | OpenCart поръчки |
| prestashop-webhook | PrestaShop поръчки |
| magento-webhook | Magento поръчки |
| check-login-rate | Rate limiting |
| verify-recaptcha | reCAPTCHA |
| setup-first-admin | Първоначална настройка |
| invite-user | Покана на потребител |
| delete-user | Изтриване на потребител |

---

Документация генерирана на: \${new Date().toLocaleDateString('bg-BG')}
`;

export const DocumentationTab = () => {
  const { toast } = useToast();
  const { logoUrl } = useCompanyLogo();
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and highlight search results
  const filteredContent = useMemo(() => {
    if (!searchQuery.trim()) return documentationContent;
    return documentationContent;
  }, [searchQuery]);

  // Find matching sections for search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const lines = documentationContent.split('\n');
    const results: { lineIndex: number; text: string; section: string }[] = [];
    let currentSection = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('## ')) {
        currentSection = line.replace(/^#+\s*/, '');
      }
      if (line.toLowerCase().includes(query)) {
        results.push({
          lineIndex: i,
          text: line.replace(/^[#\-\|*\s]+/, '').trim(),
          section: currentSection,
        });
      }
    }
    return results.slice(0, 20);
  }, [searchQuery]);

  const handleDownload = () => {
    setDownloading(true);
    try {
      const blob = new Blob([documentationContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `документация-система-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Успех',
        description: 'Документацията беше изтеглена успешно',
      });
    } catch (error) {
      toast({
        title: 'Грешка',
        description: 'Неуспешно изтегляне на документацията',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Popup blocked');
      }

      const convertMarkdownToHtml = (md: string): string => {
        let html = md
          .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
          .replace(/^### (.+)$/gm, '<h3>$1</h3>')
          .replace(/^## (.+)$/gm, '<h2>$1</h2>')
          .replace(/^# (.+)$/gm, '<h1>$1</h1>')
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/^\|(.+)\|$/gm, (match, content) => {
            const cells = content.split('|').map((c: string) => c.trim());
            return '<tr>' + cells.map((c: string) => `<td>${c}</td>`).join('') + '</tr>';
          })
          .replace(/^- (.+)$/gm, '<li>$1</li>')
          .replace(/^---$/gm, '<hr>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/\n/g, '<br>');
        
        return html;
      };

      const htmlContent = convertMarkdownToHtml(documentationContent);
      const dateStr = new Date().toLocaleDateString('bg-BG');

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="bg">
        <head>
          <meta charset="UTF-8">
          <title>Документация на системата</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
            * { font-family: 'Roboto', Arial, sans-serif; box-sizing: border-box; }
            body { padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #333; font-size: 11pt; }
            .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
            .header img { max-width: 150px; height: auto; margin-bottom: 15px; }
            h1 { font-size: 22pt; color: #1f2937; margin: 20px 0 10px; page-break-after: avoid; }
            h2 { font-size: 16pt; color: #374151; margin: 25px 0 10px; padding-bottom: 5px; border-bottom: 1px solid #e5e7eb; page-break-after: avoid; }
            h3 { font-size: 13pt; color: #4b5563; margin: 15px 0 8px; page-break-after: avoid; }
            h4 { font-size: 11pt; color: #6b7280; margin: 10px 0 5px; }
            p { margin: 8px 0; }
            li { margin: 4px 0; padding-left: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10pt; }
            td { border: 1px solid #d1d5db; padding: 6px 10px; }
            tr:first-child td { background: #f3f4f6; font-weight: 500; }
            hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
            .date { text-align: center; color: #9ca3af; font-size: 10pt; margin-top: 10px; }
            @media print { body { padding: 20px; } .no-print { display: none; } h1, h2, h3 { page-break-after: avoid; } tr { page-break-inside: avoid; } }
          </style>
        </head>
        <body>
          <div class="header">
            ${logoUrl ? `<img src="${logoUrl}" alt="Лого" />` : ''}
            <h1>СИСТЕМА ЗА УПРАВЛЕНИЕ НА ОНЛАЙН БИЗНЕС</h1>
            <p style="font-size: 14pt; color: #6b7280;">Пълна документация v3.0</p>
            <p class="date">Генерирана на: ${dateStr}</p>
          </div>
          <div class="content">${htmlContent}</div>
          <script>document.fonts.ready.then(() => { setTimeout(() => { window.print(); }, 500); });</script>
        </body>
        </html>
      `);
      printWindow.document.close();
      
      toast({
        title: 'Успех',
        description: 'PDF документацията е готова за печат',
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно генериране на PDF. Моля, разрешете изскачащи прозорци.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const sections = [
    { icon: Globe, title: '1. Общ преглед', description: 'Обща информация за системата и нейните възможности' },
    { icon: ShoppingCart, title: '2. Модул "Поръчки"', description: 'Управление на поръчки, статуси, филтри и групови действия' },
    { icon: UserCheck, title: '3. CRM модул', description: 'Управление на клиенти, тагове, бележки, автоматично попълване' },
    { icon: DollarSign, title: '4. Финансов модул', description: 'Плащания, разходи, печалба, кредитни известия' },
    { icon: Truck, title: '5. Куриерски интеграции', description: '7 куриера: Econt, Speedy, Box Now, Sameday, DHL, Европат, CVC' },
    { icon: Package, title: '6. Модул "Инвентар"', description: 'Продукти, категории, доставчици, движения, документи и отчети' },
    { icon: Building2, title: '7. Многоскладов режим', description: 'Управление на наличности в множество локации' },
    { icon: Layers, title: '8. Приспадане на наличности', description: 'Автоматично управление при промяна на статус' },
    { icon: MessageCircle, title: '9. Connectix', description: 'Viber и SMS съобщения до клиенти' },
    { icon: Users, title: '10. Nekorekten', description: 'Проверка на коректност на клиенти' },
    { icon: Settings, title: '11. Настройки', description: 'API, платформи, брандинг, роли, фабрично нулиране' },
    { icon: Shield, title: '12. Сигурност', description: 'Автентикация, роли, RLS, rate limiting' },
    { icon: Database, title: '13. Технологии', description: 'React, TypeScript, Tailwind, Lovable Cloud' },
    { icon: BarChart3, title: '14. Edge Functions', description: 'Куриери, webhooks, синхронизация, auth' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Документация на системата
              </CardTitle>
              <CardDescription className="mt-2">
                Пълна документация за функционалността и използването на системата v3.0
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload} disabled={downloading}>
                <Download className="w-4 h-4 mr-2" />
                {downloading ? 'Изтегляне...' : 'Свали MD'}
              </Button>
              <Button onClick={handleDownloadPdf} disabled={downloadingPdf} className="bg-rose-600 hover:bg-rose-700">
                <FileDown className="w-4 h-4 mr-2" />
                {downloadingPdf ? 'Генериране...' : 'Свали PDF'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Търси в документацията..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search results */}
          {searchQuery.trim() && searchResults.length > 0 && (
            <div className="mb-6 space-y-1 p-4 rounded-lg border bg-muted/30">
              <p className="text-sm font-medium mb-2">
                Намерени {searchResults.length} резултата за "{searchQuery}"
              </p>
              {searchResults.map((result, idx) => (
                <div key={idx} className="text-sm py-1 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground text-xs">{result.section} → </span>
                  <span>{result.text}</span>
                </div>
              ))}
            </div>
          )}

          {searchQuery.trim() && searchResults.length === 0 && (
            <div className="mb-6 p-4 rounded-lg border bg-muted/30 text-center text-muted-foreground">
              Няма намерени резултати за "{searchQuery}"
            </div>
          )}

          {/* Sections grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {sections.map((section, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
              >
                <section.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-sm">{section.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-6" />

          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Пълен текст на документацията
            </h3>
            <ScrollArea className="h-[500px] w-full rounded-lg border bg-muted/30 p-4">
              <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
                {filteredContent}
              </pre>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

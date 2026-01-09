import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Download, BookOpen, ShoppingCart, Package, 
  MessageCircle, Settings, Users, Truck, Building2, 
  Database, Shield, Layers, BarChart3, Globe, FileDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';
import jsPDF from 'jspdf';

const documentationContent = `
# СИСТЕМА ЗА УПРАВЛЕНИЕ НА ПОРЪЧКИ И СКЛАДОВО СТОПАНСТВО
## Пълна документация v1.0

---

## 1. ОБЩ ПРЕГЛЕД

Системата е цялостно решение за управление на онлайн бизнес, включващо:
- Управление на поръчки от различни платформи
- Складово стопанство и инвентар
- Интеграция с куриерски услуги
- Автоматични съобщения до клиенти
- Издаване на фактури
- Синхронизация с e-commerce платформи

---

## 2. МОДУЛ "ПОРЪЧКИ" (/)

### 2.1 Преглед на поръчки
- **Таблица с поръчки**: Показва всички поръчки с възможност за сортиране по всяка колона
- **Филтриране**: По статус, източник, дата, куриер, телефон, продукт
- **Търсене**: Бързо търсене по всички полета
- **Селекция**: Избор на множество поръчки за групови действия

### 2.2 Полета в поръчка
| Поле | Описание |
|------|----------|
| ID | Уникален номер на поръчката |
| Източник | Откъде е дошла поръчката (WooCommerce, Google, Facebook и др.) |
| Дата | Дата и час на създаване |
| Клиент | Име на клиента |
| Коректност | Флаг дали клиентът е коректен |
| Телефон | Телефонен номер с флаг на държава |
| Цена | Обща стойност в EUR |
| Продукт | Име на продукта |
| Каталожен номер | SKU/Код на продукта |
| Количество | Брой единици |
| Доставка | Адрес за доставка |
| Куриер | Куриерска фирма и товарителница |
| Статус | Текущ статус на поръчката |
| Коментар | Вътрешни бележки |

### 2.3 Действия с поръчки
- **Редактиране**: Промяна на всички полета
- **Фактура**: Издаване на фактура за поръчката
- **Печат**: Отпечатване на поръчката
- **Товарителница**: Отваряне на линк за проследяване
- **Viber/SMS**: Изпращане на съобщение до клиента
- **Изтриване**: Изтриване на поръчка

### 2.4 Групови действия
- Промяна на статус на множество поръчки
- Изтриване на множество поръчки

### 2.5 Статуси на поръчки
Статусите са конфигурируеми и могат да се настройват от Settings > Статуси.
Примерни статуси: Нова, В обработка, Потвърдена, Изпратена, Доставена, Отказана.

### 2.6 Автоматично приспадане на наличности
Когато поръчка смени статус на "Изпратена" (или друг конфигуриран статус), системата автоматично:
1. Търси продукт в склада по каталожен номер или име
2. Създава движение "изход" от склада
3. Намалява наличността на продукта

---

## 3. МОДУЛ "ИНВЕНТАР" (/inventory)

### 3.1 Продукти
- **Списък**: Всички продукти с наличности, цени, категории
- **Добавяне**: Нов продукт с всички детайли
- **Редактиране**: Промяна на продукт
- **Баркод скенер**: Бързо търсене по баркод

#### Полета на продукт:
| Поле | Описание |
|------|----------|
| SKU | Уникален код |
| Име | Наименование |
| Описание | Подробно описание |
| Категория | Категория на продукта |
| Баркод | EAN/UPC код |
| Покупна цена | Цена на придобиване |
| Продажна цена | Цена за клиент |
| Текуща наличност | Брой в склада |
| Минимална наличност | Аларма при ниска наличност |
| Мерна единица | бр., кг., м. и др. |
| Активен | Дали се показва |

### 3.2 Комплекти (Bundles)
Продуктите могат да бъдат комплекти от други продукти.
При изписване на комплект, автоматично се изписват и компонентите му.

### 3.3 Категории
- Йерархична структура на категории
- Подкатегории
- Описание на категория

### 3.4 Доставчици
- Списък на доставчици
- Данни: Име, ЕИК, ДДС номер, адрес, телефон, имейл
- Контактно лице
- Бележки

### 3.5 Движения
Всяко движение на стока се записва:
- **Вход (in)**: Получаване на стока
- **Изход (out)**: Изписване на стока
- **Корекция (adjustment)**: Корекция при инвентаризация
- **Връщане (return)**: Върната стока

### 3.6 Документи
Складови документи:
- **ПП**: Приемо-предавателен протокол
- **РП**: Разходен протокол
- **КР**: Корекция
- **ВР**: Връщане
- **ИН**: Инвентаризация

### 3.7 Отчети
- Наличности към момента
- Движения за период
- Стойност на склада
- Продукти под минимум

### 3.8 Прогнози
Прогнозиране на нужди от зареждане на база исторически данни.

### 3.9 WooCommerce синхронизация
- Синхронизация на продукти от WooCommerce
- Актуализация на наличности към WooCommerce
- Ръчна или автоматична синхронизация

---

## 4. МОДУЛ "СЪОБЩЕНИЯ" (/messages)

### 4.1 Преглед
Всички изпратени съобщения до клиенти чрез Connectix API.

### 4.2 Канали
- **Viber**: Съобщения през Viber Business
- **SMS**: Текстови съобщения

### 4.3 Статуси на съобщения
- **Pending**: Изчакващо
- **Sent**: Изпратено
- **Delivered**: Доставено
- **Read**: Прочетено
- **Failed**: Неуспешно

### 4.4 Информация
- Телефон на получател
- Име на клиент
- Свързана поръчка
- Шаблон използван
- Дата на изпращане
- Дата на доставка/прочитане

---

## 5. МОДУЛ "НАСТРОЙКИ" (/settings)

### 5.1 API
Основни API настройки:
- WooCommerce URL, Consumer Key, Consumer Secret
- Webhook URL за получаване на поръчки
- Статус за автоматично приспадане на наличности

### 5.2 Платформи
Интегрирани e-commerce платформи:
- **WooCommerce**: Пълна интеграция
- **OpenCart**: Webhook интеграция
- **Shopify**: Webhook интеграция
- **PrestaShop**: Webhook интеграция
- **Magento**: Webhook интеграция

За всяка платформа:
- URL на магазина
- API ключове
- Включване/изключване
- Автоматична синхронизация
- Тестване на връзка

### 5.3 Източници
Конфигуриране на източници на поръчки:
- Име на източник
- Лого/Икона
- Линк към платформата

### 5.4 Лого
- **Фирмено лого**: Показва се в хедъра
- **Favicon**: Иконка в браузъра
- **Login фон**: Фон на страницата за вход

### 5.5 Куриери
Списък с куриерски фирми:
- Име на куриер
- Лого
- URL pattern за проследяване

Примери: Еконт, Спиди, DHL, и др.

### 5.6 Статуси
Конфигуриране на статуси на поръчки:
- Име на статус
- Цвят
- Икона
- Подредба
- Статус по подразбиране

### 5.7 Фирма
Фирмени данни за фактури:
- Пълно наименование
- ЕИК/Булстат
- ДДС номер (ако е регистрирана)
- Седалище и адрес
- Адрес за кореспонденция
- Управител
- Имейл, телефон
- Банкови данни (IBAN, BIC, Банка)
- Следващ номер на фактура
- Уебсайт

Персонализация:
- Заглавие на страница "Поръчки"
- Заглавие на страница "Склад"
- Текст във футъра
- Линкове във футъра
- Заглавие и описание на Login страницата

### 5.8 Потребители (само за администратори)
- Списък на разрешени потребители
- Добавяне на нов потребител (име, имейл, парола, роля)
- Роли: admin, user
- Изтриване на потребител

### 5.9 Connectix интеграция
Настройки за Viber/SMS съобщения:
- API ключ
- Sandbox режим
- Шаблони за съобщения
- Автоматични тригери

---

## 6. АВТЕНТИКАЦИЯ

### 6.1 Вход
- Вход с имейл и парола
- Само разрешени потребители могат да влязат
- Ролева система (admin/user)

### 6.2 Права
- **Admin**: Пълен достъп до всички функции
- **User**: Ограничен достъп (без управление на потребители)

---

## 7. WEBHOOKS

Системата поддържа webhooks за автоматично получаване на поръчки:

| Платформа | Endpoint |
|-----------|----------|
| WooCommerce | /functions/v1/woocommerce-webhook |
| OpenCart | /functions/v1/opencart-webhook |
| Shopify | /functions/v1/shopify-webhook |
| PrestaShop | /functions/v1/prestashop-webhook |
| Magento | /functions/v1/magento-webhook |

---

## 8. БАЗА ДАННИ

### Основни таблици:
- **orders**: Поръчки
- **order_statuses**: Статуси на поръчки
- **inventory_products**: Продукти в склада
- **inventory_categories**: Категории
- **stock_movements**: Движения на стоки
- **stock_documents**: Складови документи
- **stock_batches**: Партиди
- **suppliers**: Доставчици
- **product_bundles**: Комплекти
- **units_of_measure**: Мерни единици
- **couriers**: Куриери
- **ecommerce_platforms**: Платформи
- **invoices**: Фактури
- **connectix_messages**: Съобщения
- **api_settings**: API настройки
- **company_settings**: Фирмени данни
- **allowed_users**: Разрешени потребители

---

## 9. СИГУРНОСТ

- Row Level Security (RLS) на всички таблици
- Само автентикирани потребители имат достъп
- Разрешен списък с потребители
- API ключовете се пазят криптирани
- Service Role ключ само за edge functions

---

## 10. ТЕХНОЛОГИИ

- **Frontend**: React, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Edge Functions)
- **Hosting**: Lovable Cloud
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage

---

## 11. КОНТАКТИ И ПОДДРЪЖКА

За въпроси и поддръжка се свържете с администратора на системата.

---

Документация генерирана на: ${new Date().toLocaleDateString('bg-BG')}
`;

export const DocumentationTab = () => {
  const { toast } = useToast();
  const { logoUrl } = useCompanyLogo();
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

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
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Add logo if available
      let startY = 25;
      if (logoUrl) {
        try {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = logoUrl;
          });
          doc.addImage(img, 'PNG', 15, 10, 40, 20);
          startY = 45;
        } catch (e) {
          console.log('Логото не може да бъде добавено към PDF');
        }
      }

      // Title - using Unicode text rendering
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('SISTEMA ZA UPRAVLENIE NA', 105, startY, { align: 'center' });
      doc.text('PORACHKI I SKLADOVO STOPANSTVO', 105, startY + 8, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Palna dokumentaciya v1.0', 105, startY + 18, { align: 'center' });

      // Date
      doc.setFontSize(10);
      const dateStr = new Date().toLocaleDateString('bg-BG');
      doc.text('Generirana na: ' + dateStr, 105, startY + 26, { align: 'center' });

      // Separator line
      doc.setDrawColor(200, 200, 200);
      doc.line(15, startY + 32, 195, startY + 32);

      let yPosition = startY + 42;
      const pageHeight = 280;
      const lineHeight = 6;
      const marginLeft = 15;
      const maxWidth = 180;

      // Bulgarian to Latin transliteration map
      const transliterate = (text: string): string => {
        const map: { [key: string]: string } = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh',
          'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
          'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
          'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sht', 'ъ': 'a', 'ь': '',
          'ю': 'yu', 'я': 'ya',
          'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ж': 'Zh',
          'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
          'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F',
          'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sht', 'Ъ': 'A', 'Ь': '',
          'Ю': 'Yu', 'Я': 'Ya'
        };
        return text.split('').map(char => map[char] || char).join('');
      };

      // Process content
      const lines = documentationContent.split('\n');
      
      for (const line of lines) {
        if (yPosition > pageHeight) {
          doc.addPage();
          yPosition = 20;
        }

        const trimmedLine = line.trim();
        const latinLine = transliterate(trimmedLine);
        
        if (trimmedLine.startsWith('# ')) {
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(180, 50, 50);
          const text = latinLine.replace('# ', '');
          doc.text(text, marginLeft, yPosition);
          yPosition += lineHeight * 1.5;
        } else if (trimmedLine.startsWith('## ')) {
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(60, 60, 60);
          const text = latinLine.replace('## ', '');
          doc.text(text, marginLeft, yPosition);
          yPosition += lineHeight * 1.3;
        } else if (trimmedLine.startsWith('### ')) {
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(80, 80, 80);
          const text = latinLine.replace('### ', '');
          doc.text(text, marginLeft, yPosition);
          yPosition += lineHeight * 1.2;
        } else if (trimmedLine.startsWith('#### ')) {
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(100, 100, 100);
          const text = latinLine.replace('#### ', '');
          doc.text(text, marginLeft, yPosition);
          yPosition += lineHeight;
        } else if (trimmedLine.startsWith('- **')) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          const text = '* ' + latinLine.replace('- **', '').replace('**:', ':').replace('**', '');
          const splitText = doc.splitTextToSize(text, maxWidth);
          doc.text(splitText, marginLeft + 5, yPosition);
          yPosition += lineHeight * splitText.length;
        } else if (trimmedLine.startsWith('- ')) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          const text = '* ' + latinLine.replace('- ', '');
          const splitText = doc.splitTextToSize(text, maxWidth);
          doc.text(splitText, marginLeft + 5, yPosition);
          yPosition += lineHeight * splitText.length;
        } else if (trimmedLine.startsWith('|')) {
          // Table row
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
          const text = latinLine.replace(/\|/g, ' | ').trim();
          const splitText = doc.splitTextToSize(text, maxWidth);
          doc.text(splitText, marginLeft, yPosition);
          yPosition += lineHeight * splitText.length;
        } else if (trimmedLine === '---') {
          doc.setDrawColor(200, 200, 200);
          doc.line(marginLeft, yPosition, 195, yPosition);
          yPosition += lineHeight;
        } else if (trimmedLine.length > 0) {
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(40, 40, 40);
          const cleanText = latinLine.replace(/\*\*/g, '').replace(/\*/g, '');
          const splitText = doc.splitTextToSize(cleanText, maxWidth);
          doc.text(splitText, marginLeft, yPosition);
          yPosition += lineHeight * splitText.length;
        } else {
          yPosition += lineHeight * 0.5;
        }
      }

      // Footer on last page
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Stranitsa ' + i + ' ot ' + pageCount, 105, 290, { align: 'center' });
      }

      doc.save('dokumentaciya-sistema-' + new Date().toISOString().split('T')[0] + '.pdf');
      
      toast({
        title: 'Успех',
        description: 'PDF документацията беше изтеглена успешно',
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: 'Грешка',
        description: 'Неуспешно генериране на PDF',
        variant: 'destructive',
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const sections = [
    { icon: Globe, title: '1. Общ преглед', description: 'Обща информация за системата и нейните възможности' },
    { icon: ShoppingCart, title: '2. Модул "Поръчки"', description: 'Управление на поръчки, статуси, филтри и групови действия' },
    { icon: Package, title: '3. Модул "Инвентар"', description: 'Продукти, категории, доставчици, движения, документи и отчети' },
    { icon: MessageCircle, title: '4. Модул "Съобщения"', description: 'Viber и SMS съобщения до клиенти' },
    { icon: Settings, title: '5. Модул "Настройки"', description: 'API, платформи, източници, брандинг, куриери, статуси, фирмени данни' },
    { icon: Shield, title: '6. Автентикация', description: 'Вход, роли и права на достъп' },
    { icon: Layers, title: '7. Webhooks', description: 'Автоматично получаване на поръчки от платформи' },
    { icon: Database, title: '8. База данни', description: 'Структура на таблиците и връзки' },
    { icon: Shield, title: '9. Сигурност', description: 'RLS политики и защита на данните' },
    { icon: BarChart3, title: '10. Технологии', description: 'Използвани технологии и инструменти' },
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
                Пълна документация за функционалността и използването на системата
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
                {documentationContent}
              </pre>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

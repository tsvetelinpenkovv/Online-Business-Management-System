import { useState, useMemo, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, Download, BookOpen, ShoppingCart, Package, 
  MessageCircle, Settings, Users, Truck, Building2, 
  Database, Shield, Layers, BarChart3, Globe, FileDown, Search,
  DollarSign, UserCheck, RotateCcw, Percent, Warehouse, ScanBarcode
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';


const documentationContent = `
# СИСТЕМА ЗА УПРАВЛЕНИЕ НА ОНЛАЙН БИЗНЕС
## Пълна документация v4.0

---

## 1. ОБЩ ПРЕГЛЕД

Системата е цялостно решение за управление на онлайн бизнес, включващо:
- Управление на поръчки от различни платформи
- Складово стопанство и инвентар с тегло и размери
- Резервация и изписване на наличности (свързване order_items ↔ inventory_products)
- **CRM модул**: Управление на клиенти, тагове, бележки, масови действия
- **Финансов модул**: Проследяване на плащания, разходи, масов експорт на фактури
- **Промокодове**: Управление на отстъпки (процентни/фиксирани)
- Интеграция с 7 куриерски услуги (Econt, Speedy, Box Now, Sameday, DHL, Evropat, CVC)
- Автоматично създаване и масово генериране на товарителници
- Търсене на офиси и автомати
- Доставчикови цени по доставчик (supplier_products)
- История на ценовите промени
- Автоматични съобщения до клиенти чрез Connectix (Viber/SMS)
- Проверка на клиенти чрез Nekorekten API
- Издаване на фактури и кредитни известия
- Синхронизация с e-commerce платформи (WooCommerce, Shopify, OpenCart, PrestaShop, Magento, Custom API)
- Мулти-магазин режим с различни държави
- Лизингови статуси за TBI, BNP и UniCredit
- Редактор на интерфейса за персонализация
- **Глобално търсене** (Ctrl+K): Command palette за навигация, настройки и бързи действия
- **Печат на всяка страница**: Бутон за принтиране с оптимизирани print стилове

---

## 2. МОДУЛ "ПОРЪЧКИ" (/)

### 2.1 Преглед на поръчки
- **Таблица с поръчки**: Показва всички поръчки с възможност за сортиране по всяка колона
- **Филтриране**: По статус, източник, дата, куриер, телефон, продукт, каталожен номер, магазин
- **Търсене**: Бързо търсене по клиент, телефон, ID и каталожен номер
- **Селекция**: Избор на множество поръчки за групови действия (чекбокси)
- **Пагинация**: Страници по 100 поръчки (сървърна пагинация)
- **Количество / Наличност**: Обединена колона показваща количеството и наличността
- **Realtime обновяване**: Нови поръчки се появяват автоматично

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
- В "Нова поръчка" и "Редактиране" има бутон "+ Добави продукт"
- Всеки продукт има отделни полета за име, каталожен номер, количество и цена
- При добавяне, ProductAutocomplete предлага продукти от склада
- **inventory_product_id** се записва автоматично за точно свързване със склада
- Продуктите се показват като списък в таблицата

### 2.4 Автоматично попълване от CRM
При въвеждане на телефонен номер в "Нова поръчка":
- Търси клиента в CRM базата
- Попълва име, имейл и адрес за доставка
- Показва предишни поръчки на клиента

### 2.5 Действия с поръчки
- **Редактиране**: Промяна на всички полета включително множество продукти
- **Фактура**: Издаване на фактура за поръчката
- **Печат**: Отпечатване на поръчката
- **Създай товарителница**: Автоматично създаване с данни от поръчката
- **Отвори товарителница**: Отваряне на линк за проследяване
- **Viber/SMS**: Изпращане на съобщение до клиента чрез Connectix
- **Проверка в Nekorekten**: Ръчна проверка дали клиентът е коректен
- **Изтриване**: Изтриване на поръчка
- **История**: Пълна история на промените (кой, кога, какво е променил)

### 2.6 Групови действия
- Промяна на статус на множество поръчки
- Масово редактиране (куриер, адрес, статус)
- Изтриване на множество поръчки
- Печат на множество фактури/разписки
- Масово създаване на товарителници
- Печат на товарителници

### 2.7 Статуси на поръчки
Статусите са конфигурируеми и могат да се пренареждат чрез drag & drop.
Примерни статуси: Нова, В обработка, Потвърдена, Изпратена, Доставена, Отказана.
Всеки статус има собствен цвят и икона.

### 2.8 Колони
- **Видимост на колони**: Изберете кои колони да виждате чрез бутона "Колони"
- Настройките се запазват в localStorage
- На мобилно: Компактен изглед с основни данни

### 2.9 Експорт
- **CSV**: Всички поръчки в CSV формат
- **XML**: Всички поръчки в XML формат
- **Excel**: Експорт с форматиране
- **PDF**: Справка с обобщение

### 2.10 Бутони в хедъра
| Бутон | Функция |
|-------|---------|
| 🔍 Лупа | Глобално търсене (Ctrl+K) |
| ↻ Обнови | Ръчно или автоматично обновяване (1/2/5/10 мин) |
| ↓ Експорт | CSV, XML, Excel, PDF |
| ⚙ Настройки | Отваря страницата с настройки |
| + Нова поръчка | Създаване на нова поръчка |
| 🔔 Сток алерти | Показва продукти с ниска наличност |
| 🗑 Кеш | Изчистване на кеша |
| 🌙/☀ Тема | Превключване между светла и тъмна тема |

---

## 3. CRM МОДУЛ (/crm)

### 3.1 Какво е CRM?
CRM (Customer Relationship Management) модулът позволява централизирано управление на клиентите.

### 3.2 Клиентска база
- **Автоматично създаване**: Клиенти се създават автоматично от поръчки
- **Синхронизация**: Бутон "Синхронизирай от поръчки" за импорт на съществуващи клиенти
- **Търсене**: По име, телефон, имейл
- **Филтриране**: По тагове (VIP, Нов, Редовен, Проблемен, Лоялен, Корпоративен, Дропшипинг)

### 3.3 Статистики (KPI карти)
| Карта | Описание |
|-------|----------|
| Клиенти | Общ брой клиенти |
| VIP | Брой VIP клиенти |
| Общо приходи | Сумарна стойност от всички клиенти |
| Ср. стойност | Средна стойност на поръчка |

### 3.4 Клиентски детайли
При клик на клиент се отваря детайлен преглед:
- **Контактна информация**: Име, телефон, имейл, адрес, град
- **Тагове**: Добавяне/премахване на тагове с един клик
- **История на поръчки**: Всички поръчки с дата, продукт и стойност
- **Бележки**: Добавяне и преглед на бележки (с автор и дата)

### 3.5 Масови действия
- **Чекбокси**: Избор на множество клиенти
- **Групова селекция**: Бутон "Избери всички" в заглавката на таблицата
- **Печат**: Бутон за принтиране на текущия изглед

### 3.6 Тагове
| Таг | Описание | Цвят |
|-----|----------|------|
| VIP | Ценен клиент | Жълт |
| Нов | Нов клиент | Син |
| Редовен | Редовен клиент | Зелен |
| Проблемен | Проблемен клиент | Червен |
| Лоялен | Лоялен клиент | Лилав |
| Корпоративен | Бизнес клиент | Индиго |
| Дропшипинг | Дропшипинг | Бирюзов |

### 3.7 Бутони
| Бутон | Функция |
|-------|---------|
| 🔍 Лупа | Глобално търсене |
| 🖨 Печат | Принтиране на страницата |
| ↓ Синхронизирай | Импорт на клиенти от поръчки |
| ↻ Обнови | Обновяване на данните |

---

## 4. ФИНАНСОВ МОДУЛ (/finance)

### 4.1 Обща информация
Финансовият модул предоставя пълен преглед на приходите, разходите и печалбата.

### 4.2 Финансово табло (KPI карти)
| Карта | Описание |
|-------|----------|
| Общ приход | Сума от всички платени поръчки |
| Общи разходи | Сума от всички въведени разходи |
| Нетна печалба | Приход минус разходи |
| Неплатени | Обща стойност на неплатени поръчки |
| Платени поръчки | Брой напълно платени |
| Средна стойност | Средна стойност на поръчка |

### 4.3 Проследяване на плащания
| Статус | Описание | Бадж |
|--------|----------|------|
| Платена | Пълно заплатена | 🟢 Зелен |
| Неплатена | Без плащане | 🔴 Червен |
| Частично | Частично платена | 🟡 Жълт |

- **Inline редактиране**: Кликнете на реда за промяна на статус
- **Платена сума**: Въвеждане на конкретната платена сума
- **Метод на плащане**: Наличен, Карта, Банков превод, Наложен платеж
- **Дата на плащане**: Автоматично се записва

### 4.4 Разходи
- **Добавяне**: Бутон "+ Нов разход" отваря форма
- **Категории**: Наем, Маркетинг, Заплати, Доставки, Софтуер, Консумативи, Друго
- **Филтриране по дата**: Избор на период с календар
- **Изтриване**: Бутон за изтриване на разход

### 4.5 Масов експорт на фактури — НОВО!
- **Бутон**: "Експорт фактури" в хедъра
- **Период**: Избор на начална и крайна дата
- **Генериране**: Създава един PDF файл с всички фактури за периода
- Включва: номер, дата, купувач, продукт, сума, ДДС

### 4.6 Бутони в хедъра
| Бутон | Функция |
|-------|---------|
| 🔍 Лупа | Глобално търсене |
| 🖨 Печат | Принтиране на страницата |
| 📄 Експорт фактури | Масов PDF с фактури за период |
| 📅 Календар (от-до) | Избор на период за филтриране |

---

## 5. КУРИЕРСКИ ИНТЕГРАЦИИ

### 5.1 Поддържани куриери
| Куриер | Функции | Тип автентикация |
|--------|---------|------------------|
| **Еконт** | Товарителници, офиси, автоматично проследяване | Потребител/Парола |
| **Спиди** | Товарителници, офиси, калкулация | Потребител/Парола |
| **Box Now** | Товарителници, автомати | Client ID/Secret |
| **Sameday** | AWB, автомати, проследяване | Потребител/Парола |
| **DHL** | Товарителници, сервизни точки | Потребител/Парола + Account |
| **Европат** | Товарителници, офиси | API Key |
| **CVC** | Товарителници, офиси | Потребител/Парола |

### 5.2 Създаване на товарителница
1. Отворете менюто с действия на поръчка (три точки)
2. Изберете "Създай товарителница"
3. Диалогът автоматично попълва данните от поръчката
4. **Теглото се попълва автоматично от продукта** (ако е въведено weight_kg)
5. Изберете куриер и тип доставка (адрес или офис)
6. При доставка до офис - използвайте търсенето на офиси
7. Натиснете "Създай товарителница"

### 5.3 Масово създаване на товарителници
1. Изберете множество поръчки чрез чекбоксовете
2. Отворете менюто за печат
3. Изберете "Създай товарителници"
4. Конфигурирайте куриер, подател, тегло и наложен платеж
5. Натиснете бутона за създаване

### 5.4 Автоматично проследяване на пратки
- Настройва се в Настройки → Куриерски API → Автоматично проследяване
- Системата периодично проверява статуса на пратките
- При "Доставена" → автоматично обновява статуса на поръчката
- При "Върната" → автоматично обновява статуса

---

## 6. МОДУЛ "ИНВЕНТАР" (/inventory)

### 6.1 Продукти
- **Списък**: Всички продукти с наличности, цени, категории
- **Inline редактиране на наличност**: Кликнете на бадж с наличността за директна промяна
- **Добавяне**: Нов продукт с всички детайли (SKU, баркод, тегло, размери)
- **Редактиране**: Промяна на продукт
- **Баркод скенер**: Бързо търсене по баркод (камера или ръчно)
- **Продуктова детайлна страница**: Статистика по статуси, снимки от WooCommerce

### 6.2 Тегло и размери — НОВО!
Всеки продукт може да има:
| Поле | Описание |
|------|----------|
| weight_kg | Тегло в килограми |
| length_cm | Дължина в сантиметри |
| width_cm | Ширина в сантиметри |
| height_cm | Височина в сантиметри |

Теглото автоматично се попълва при създаване на товарителница.

### 6.3 Наличности
- **Наличност**: Текущо количество (лилав бадж)
- **Резервирано**: Резервирано количество (червен бадж)
- **Свободно**: Налично минус резервирано (зелен/жълт/червен)

### 6.4 Комплекти (Bundles)
Продуктите могат да бъдат комплекти от други продукти.
**ВАЖНО**: Комплектът няма собствена наличност - само компонентите му имат!

### 6.5 Табове в инвентара
| Таб | Описание |
|-----|----------|
| Табло | Обща статистика, KPI и предупреждения |
| Продукти | Списък с продукти + масови действия |
| Доставчици | Управление на доставчици |
| Категории | Йерархична структура |
| Документи | Складови документи (приход/разход/трансфер) |
| Движения | История на движенията |
| Справки | Аналитични справки с експорт |
| Прогнози | Алерти за ниска наличност |
| Цени | История на ценовите промени |
| Одит лог | Проследяване на всички действия |
| Серийни номера | Проследяване по сериен номер |
| Медия | Библиотека с изображения |

### 6.6 Доставчикови цени — НОВО!
В детайлите на продукта, таб "Доставчици":
- Различна доставна цена от всеки доставчик
- Доставчиков SKU
- Време за доставка (lead time в дни)
- Възможност за сравнение на цени

### 6.7 Импорт/Експорт
- **Импорт**: CSV/Excel шаблони за масово въвеждане
- **Експорт**: CSV, Excel, PDF
- Поддържа: продукти, движения, цени, складове

### 6.8 Бутони в хедъра
| Бутон | Функция |
|-------|---------|
| 🔍 Лупа | Глобално търсене |
| 🖨 Печат | Принтиране на страницата |
| 📊 Баркод | Сканиране на баркод (камера) |
| 📋 Импорт/Експорт | CSV/Excel операции |
| % Масова промяна | Промяна на цени за множество продукти |
| ↻ Обнови | Обновяване на данните |

---

## 7. МНОГОСКЛАДОВ РЕЖИМ

### 7.1 Активиране
1. Отидете в Настройки → Складове
2. Включете "Многоскладов режим"
3. Добавете складове

### 7.2 Функции
- Управление на наличности в множество локации
- Трансфер на стоки между складове (складов документ тип "Трансфер")
- Дашборд с графики за разпределение
- Предупреждения за ниски наличности по складове
- KPI табло за всеки склад

---

## 8. МУЛТИ-МАГАЗИН РЕЖИМ

### 8.1 Какво е мулти-магазин?
Мулти-магазин режимът позволява свързване на множество WooCommerce магазини от различни държави (България, Гърция, Румъния, Унгария и др.) към една обща система.

### 8.2 Активиране
1. Отидете в Настройки → Магазини
2. Включете "Мулти-магазин режим"
3. Добавете магазин — изберете държава и въведете WooCommerce API ключове

### 8.3 Функции
- **Единен склад**: Всички магазини четат наличности от един общ склад
- **Табове по държава**: Табове за всеки магазин с флаг и брой поръчки
- **Флагове в таблицата**: Флаг на държавата пред номера на поръчката
- **Drag & Drop пренареждане**: Подредете магазините
- **Автоматична синхронизация**: Обновяване на наличности при промяна
- **Webhook за всеки магазин**: Уникален URL за приемане на поръчки
- **Тест на връзката**: Проверка на свързаността

---

## 9. АВТОМАТИЧНО ПРИСПАДАНЕ НА НАЛИЧНОСТИ

### 9.1 Настройка
1. Отидете в Склад → Настройки
2. Включете "Автоматично управление"
3. Изберете статусите за приспадане, възстановяване и резервация

### 9.2 Как работи?
1. При статус "В обработка" → количеството се резервира
2. При статус "Изпратена" → наличността се приспада физически
3. При статус "Върната" → наличността се възстановява

### 9.3 Свързване с inventory_product_id — НОВО!
- При създаване на поръчка, ProductAutocomplete записва inventory_product_id
- Приспадането използва ID вместо текстово съвпадение по име
- Гарантира точност при дублиращи се имена

---

## 10. ПРОМОКОДОВЕ — НОВО!

### 10.1 Управление
Настройки → Промокодове

### 10.2 Създаване на промокод
| Поле | Описание |
|------|----------|
| Код | Уникален код (напр. SUMMER2024) |
| Тип | Процент или Фиксирана сума |
| Стойност | Размер на отстъпката |
| Валидност от/до | Период на валидност |
| Мин. поръчка | Минимална стойност на поръчката |
| Макс. използвания | Максимален брой използвания |

### 10.3 Статус
- **Активен**: Кодът е валиден и може да се използва
- **Неактивен**: Кодът е деактивиран

### 10.4 Бутони
| Бутон | Функция |
|-------|---------|
| + Нов промокод | Създаване на нов код |
| ✏ Редактирай | Промяна на параметри |
| 🗑 Изтрий | Изтриване на код |

---

## 11. CONNECTIX ИНТЕГРАЦИЯ (Viber/SMS)

### 11.1 Функции
- Изпращане на Viber и SMS съобщения до клиенти
- Автоматично изпращане при промяна на статус
- Шаблони за съобщения

### 11.2 Статуси на съобщения
| Статус | Описание |
|--------|----------|
| Изпратено | Изпратено към Connectix |
| Доставено | Доставено до клиента |
| Прочетено | Клиентът е прочел (само Viber) |
| Грешка | Неуспешно изпращане |

### 11.3 Страница "Съобщения" (/messages)
- Таблица с всички съобщения
- Филтриране по: канал (Viber/SMS), статус, търсене
- KPI карти: общо, Viber, SMS, доставени, прочетени, грешки
- **Печат**: Бутон за принтиране
- **Глобално търсене**: Ctrl+K

---

## 12. NEKOREKTEN ИНТЕГРАЦИЯ

### 12.1 Функции
Проверка на коректността на клиенти:
| Статус | Значение |
|--------|----------|
| 🟢 Коректен | Клиентът е коректен |
| 🔴 Некоректен | Клиентът е некоректен |
| ❓ Непроверен | Няма данни |

### 12.2 Страница "Nekorekten" (/nekorekten)
- Статистики: общо, коректни, некоректни, непроверени
- Филтриране по период, статус, търсене
- Експорт на некоректни клиенти в CSV
- **Печат**: Бутон за принтиране

---

## 13. ВРЪЩАНИЯ И РЕКЛАМАЦИИ (/returns)

### 13.1 Създаване на заявка
1. Натиснете "Нова заявка"
2. Изберете поръчка (или въведете данни ръчно)
3. Изберете причина и тип (пълно/частично)
4. Добавете продукти и количества
5. Запишете

### 13.2 Статуси
| Статус | Описание |
|--------|----------|
| Заявена | Нова заявка |
| Одобрена | Одобрена от оператора |
| Получена | Стоката е получена |
| Възстановена | Сумата е възстановена |
| Отхвърлена | Заявката е отхвърлена |

### 13.3 Масови действия — НОВО!
- **Чекбокси**: Избор на множество заявки
- **Групова селекция**: Бутон "Избери всички"
- **Печат**: Бутон за принтиране

### 13.4 Бутони
| Бутон | Функция |
|-------|---------|
| 🔍 Лупа | Глобално търсене |
| 🖨 Печат | Принтиране |
| ↻ Обнови | Обновяване |
| + Нова заявка | Създаване на заявка |

---

## 14. АНАЛИТИКА (/analytics)

### 14.1 KPI карти
- Общ приход, Брой поръчки, Средна стойност, Поръчки/ден
- Конверсия, Доставени, Върнати, Процент на връщане

### 14.2 Графики
- **Тренд на приходи**: Дневни приходи за периода (AreaChart)
- **ABC анализ**: Класификация на продукти (A/B/C)
- **Продажби по продукт**: Топ продукти (PieChart)
- **Продажби по регион**: Географско разпределение
- **Приходи/Разходи тренд**: Сравнение по месеци
- **Разпределение по източник**: Откъде идват поръчките (BarChart)

### 14.3 Топ клиенти
Таблица с най-добрите клиенти по приходи.

### 14.4 Филтри
- Период (от-до) с календар
- Източник (WooCommerce, Google, Facebook и др.)
- Статус

### 14.5 Експорт
- Excel (.xlsx) и PDF с обобщение

### 14.6 Бутони
| Бутон | Функция |
|-------|---------|
| 🔍 Лупа | Глобално търсене |
| 🖨 Печат | Принтиране |
| ↓ Експорт | Excel или PDF |

---

## 15. МОДУЛ "НАСТРОЙКИ" (/settings)

### 15.1 Табове
| Таб | Описание |
|-----|----------|
| Фирмени данни | Име, ЕИК, ДДС, адрес, банкова информация |
| Статуси | Конфигуриране с drag & drop пренареждане |
| Куриери | Активиране/деактивиране на куриери |
| Куриерски API | API ключове за всеки куриер |
| Платформи | WooCommerce, OpenCart, Shopify, PrestaShop, Magento, Custom API |
| Източници | Конфигуриране на източници с лого |
| Connectix | Viber/SMS настройки |
| Магазини | Мулти-магазин режим |
| Промокодове | Управление на промо кодове — НОВО! |
| Потребители | Управление на потребители и покани |
| Интерфейс | Персонализация на текстове |
| Глобален цвят | Акцентен цвят на системата |
| Персонализация | CSS, фонове, лого, favicon |
| Известия | Звуци при нова поръчка |
| Роли и права | Конфигуриране на достъп по роли |
| Webhooks | Изходящи webhooks |
| Кеш | Управление на кеша |
| Nekorekten | Статистика на API |
| Документация | Тази страница |
| Фабрично нулиране | Изтриване на данни (Danger Zone) |

### 15.2 Как да навигирате бързо?
Използвайте **Ctrl+K** (или бутона 🔍) за глобално търсене. Напишете "промо" за да отидете директно на промокодовете, "роли" за правата и т.н.

---

## 16. АВТЕНТИКАЦИЯ И СИГУРНОСТ

- Вход с email и парола
- Rate limiting на опити за вход (5 опита за 15 минути)
- reCAPTCHA верификация
- Таен път за достъп до системата (secret_path)
- Автоматичен session timeout с предупреждение (30 мин)
- Row-Level Security (RLS) на всички таблици
- Роли: admin, user, warehouse_worker, order_operator, finance
- Ролеви права по модул (view, create, edit, delete)

---

## 17. ГЛОБАЛНО ТЪРСЕНЕ — НОВО!

### 17.1 Отваряне
- Бутон 🔍 в хедъра на всяка страница
- Клавишна комбинация: **Ctrl+K** (Windows/Linux) или **Cmd+K** (Mac)

### 17.2 Категории
| Категория | Примери |
|-----------|---------|
| Навигация | Поръчки, CRM, Финанси, Аналитика, Склад, Връщания |
| Настройки | Фирмени данни, Статуси, Куриери, Промокодове, Роли |
| Бързи действия | Нова поръчка, Нов продукт, Импорт/Експорт, Печат |

### 17.3 Как работи?
1. Отворете с Ctrl+K или бутона 🔍
2. Започнете да пишете
3. Резултатите се филтрират в реално време
4. Изберете с Enter или клик
5. Системата ви навигира към избрания елемент

---

## 18. ПЕЧАТ — НОВО!

### 18.1 Общи принципи
- Бутон 🖨 (Printer) е наличен в хедъра на всяка страница
- При натискане се отваря стандартният диалог за печат на браузъра
- Хедър, навигация и бутоните автоматично се скриват при печат
- Съдържанието е оптимизирано за A4 формат

### 18.2 Къде е наличен?
Всички страници: Поръчки, CRM, Финанси, Аналитика, Склад, Връщания, Съобщения, Nekorekten

---

## 19. ТЕХНОЛОГИИ

- **Frontend**: React 18, TypeScript, Vite
- **UI**: Tailwind CSS, shadcn/ui
- **Графики**: Recharts
- **Backend**: Lovable Cloud
- **Сървърни функции**: Deno Edge Functions
- **PDF**: jsPDF
- **Excel**: xlsx
- **Маршрутизиране**: React Router DOM v7
- **State**: React Query (TanStack), React hooks
- **Command Palette**: cmdk
- **Drag & Drop**: @dnd-kit

---

## 20. СЪРВЪРНИ ФУНКЦИИ

| Функция | Описание |
|---------|----------|
| courier-econt | Еконт API (товарителници, офиси, проследяване) |
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
| custom-webhook | Custom API поръчки |
| track-shipments-auto | Автоматично проследяване на пратки |
| check-login-rate | Rate limiting |
| verify-recaptcha | reCAPTCHA |
| setup-first-admin | Първоначална настройка |
| invite-user | Покана на потребител |
| delete-user | Изтриване на потребител |
| theme-preference | Запазване на тема предпочитание |

---

Документация генерирана на: \${new Date().toLocaleDateString('bg-BG')}
Версия: 4.0
`;

export const DocumentationTab = () => {
  const { toast } = useToast();
  const { logoUrl } = useCompanyLogo();
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fullTextRef = useRef<HTMLDivElement>(null);

  // Scroll to a section in the full text by section number
  const scrollToSection = useCallback((sectionTitle: string) => {
    const container = fullTextRef.current;
    if (!container) return;
    
    // Extract section number from title like "1. Общ преглед"
    const sectionNum = sectionTitle.match(/^(\d+)\./)?.[1];
    if (!sectionNum) return;

    const pre = container.querySelector('pre');
    if (!pre) return;

    const text = pre.textContent || '';
    const searchPattern = `## ${sectionNum}.`;
    const idx = text.indexOf(searchPattern);
    if (idx === -1) return;

    // Calculate approximate scroll position
    const lines = text.substring(0, idx).split('\n').length;
    const lineHeight = 22; // approximate line height in pixels
    const scrollTop = Math.max(0, lines * lineHeight - 40);

    // Find the ScrollArea viewport
    const viewport = container.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
  }, []);

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
      link.download = `документация-система-v4-${new Date().toISOString().split('T')[0]}.md`;
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
          <title>Документация на системата v4.0</title>
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
            <p style="font-size: 14pt; color: #6b7280;">Пълна документация v4.0</p>
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
    { icon: UserCheck, title: '3. CRM модул', description: 'Управление на клиенти, тагове, бележки, масови действия' },
    { icon: DollarSign, title: '4. Финансов модул', description: 'Плащания, разходи, масов експорт на фактури' },
    { icon: Truck, title: '5. Куриерски интеграции', description: '7 куриера + автоматично проследяване' },
    { icon: Package, title: '6. Модул "Инвентар"', description: 'Продукти с тегло/размери, доставчикови цени' },
    { icon: Building2, title: '7. Многоскладов режим', description: 'Управление на наличности в множество локации' },
    { icon: Warehouse, title: '8. Мулти-магазин', description: 'Множество WooCommerce магазини от различни държави' },
    { icon: Layers, title: '9. Приспадане на наличности', description: 'Автоматично управление с inventory_product_id' },
    { icon: Percent, title: '10. Промокодове', description: 'Управление на промо кодове и отстъпки' },
    { icon: MessageCircle, title: '11. Connectix', description: 'Viber и SMS съобщения до клиенти' },
    { icon: Users, title: '12. Nekorekten', description: 'Проверка на коректност на клиенти' },
    { icon: RotateCcw, title: '13. Връщания', description: 'Заявки за връщане с масови действия' },
    { icon: BarChart3, title: '14. Аналитика', description: 'KPI, трендове, ABC анализ, графики' },
    { icon: Settings, title: '15. Настройки', description: 'API, платформи, брандинг, роли, промокодове' },
    { icon: Shield, title: '16. Сигурност', description: 'Автентикация, роли, RLS, rate limiting' },
    { icon: Search, title: '17. Глобално търсене', description: 'Command palette с Ctrl+K' },
    { icon: ScanBarcode, title: '18. Печат', description: 'Бутон за печат на всяка страница' },
    { icon: Database, title: '19. Технологии', description: 'React, TypeScript, Tailwind, Lovable Cloud' },
    { icon: Globe, title: '20. Edge Functions', description: '25+ сървърни функции' },
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
                Пълна документация за функционалността и използването на системата v4.0
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownload} disabled={downloading}>
                <Download className="w-4 h-4 mr-2" />
                {downloading ? 'Изтегляне...' : 'Свали MD'}
              </Button>
              <Button onClick={handleDownloadPdf} disabled={downloadingPdf} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
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
                <button
                  key={idx}
                  onClick={() => {
                    setSearchQuery('');
                    scrollToSection(result.section);
                  }}
                  className="w-full text-left text-sm py-1.5 px-2 rounded hover:bg-muted border-b border-border/50 last:border-0 cursor-pointer transition-colors"
                >
                  <span className="text-primary text-xs font-medium">{result.section} → </span>
                  <span>{result.text}</span>
                </button>
              ))}
            </div>
          )}

          {searchQuery.trim() && searchResults.length === 0 && (
            <div className="mb-6 p-4 rounded-lg border bg-muted/30 text-center text-muted-foreground">
              Няма намерени резултати за "{searchQuery}"
            </div>
          )}

          {/* Sections grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {sections.map((section, index) => (
              <button 
                key={index}
                onClick={() => scrollToSection(section.title)}
                className="flex items-start gap-3 p-4 rounded-lg border bg-card hover:bg-muted/50 hover:border-primary/30 transition-colors cursor-pointer text-left"
              >
                <section.icon className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-sm">{section.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{section.description}</p>
                </div>
              </button>
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

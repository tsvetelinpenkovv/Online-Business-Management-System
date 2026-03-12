
Цел: да спрем постоянния „не се отваря“ проблем в preview/workflow и да направим зареждането стабилно.

Какво установих:
- От последните мрежови заявки в preview панела всички ключови заявки са 200 (auth refresh, company settings, orders, permissions) — това означава, че когато приложението тръгне, backend достъпът е наред.
- `secret_path` е `null`, т.е. проблемът не идва от secret path блокиране.
- Проблемът е най-вероятно в началното зареждане на preview URL с временен token (и/или iframe зареждане), не в самата страница „Управление на поръчки“.

Do I know what the issue is?
- Да: това е нестабилност в boot/preview достъп (tokenized preview URL + начално рендериране), а не функционален bug в поръчките.

План за имплементация:
1) Укрепване на boot-а още преди React да стартира (`index.html`)
- Добавям много ранен inline guard, който:
  - чисти `__lovable_token` / `_lovable_token` веднага;
  - прави еднократен recovery reload при невалиден/счупен URL state;
  - оставя чист и кратък URL, за да не се чупи preview зареждането.

2) Укрепване на старта в `src/main.tsx`
- Добавям безопасен startup fallback:
  - try/catch около URL обработката;
  - еднократен „boot recovery“ флаг в `sessionStorage` (за да няма безкрайни reload цикли);
  - глобален handler за критични runtime грешки (`error`/`unhandledrejection`) с graceful fallback UI вместо мъртва страница.

3) Error boundary за стабилен визуален failover
- Добавям компонент `AppErrorBoundary` + fallback екран:
  - „Презареди“ бутон;
  - „Стартирай в safe mode“ (`?safe=1`) като авариен режим.
- Интеграция в `App.tsx`, така че дори при runtime crash да има контролируем екран, не browser-level fail.

4) Корекция на embed headers (за preview/workflow визуализация)
- В `public/_headers`:
  - премахвам `X-Frame-Options: DENY`;
  - заменям `frame-ancestors 'none'` с allowlist, която позволява само доверените хостове за preview/workflow.
- Това пази сигурността, но спира риска приложението да „се само-блокира“ в preview контекста.

5) Проверка (end-to-end)
- 10 последователни hard refresh-а в preview панела.
- Директно отваряне на preview URL с token: трябва да се почисти и зареди стабилно.
- Навигация `/inventory` → „Поръчки“ → `/orders` (без 404 и без срив).
- Проверка на published URL за регресии.

Технически детайли (кратко):
- Файлове за промяна: `index.html`, `src/main.tsx`, `src/App.tsx`, нов `src/components/AppErrorBoundary.tsx`, `public/_headers`.
- Без промени по база/схема.
- Фокусът е върху устойчиво initial rendering + recovery + iframe-compatible security headers.

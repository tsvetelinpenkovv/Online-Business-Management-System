

# План: Стабилност, build грешки и подобрения

## Анализ на проблемите

### Проблем 1: Build грешка блокира публикуването
Файлът `useSessionTimeout.tsx` използва `NodeJS.Timeout` (4 места), което не е разпознато в browser TypeScript конфигурацията (`tsconfig.app.json` включва само `ES2020, DOM, DOM.Iterable`). Това генерира typecheck грешка при build и може да блокира публикуването на нови версии.

**Решение**: Замяна на `NodeJS.Timeout` с `ReturnType<typeof setTimeout>` навсякъде.

### Проблем 2: Дублиран route без валидация
На ред 113 в `App.tsx` има дублиран route:
```
<Route path="/:secretPath/returns" element={<Returns />} />
```
Той е без `SecretPathValidator`, което означава, че всеки произволен URL prefix ще покаже Returns страницата вместо 404.

**Решение**: Премахване на дублирания ред.

### Проблем 3: SourceIcon не поддържа refs
Console warning: `Function components cannot be given refs` за `SourceIcon`. Radix UI (DropdownMenu) подава ref, но компонентът не го приема.

**Решение**: Обвиване на `SourceIcon` с `React.forwardRef`.

### Проблем 4: Custom JS/HTML защити (по заявка)
Добавяне на:
- CSS валидатор (предупреждение за опасни свойства)
- JS sandbox с try/catch обвивка
- Бутон за аварийно нулиране на custom code
- Safe mode query param (`?safe=1`) за зареждане без custom CSS/JS

## Какво ще бъде добавено/подобрено

| # | Промяна | Файл |
|---|---------|------|
| 1 | Fix NodeJS.Timeout build error | `src/hooks/useSessionTimeout.tsx` |
| 2 | Премахване на дублиран route | `src/App.tsx` |
| 3 | forwardRef за SourceIcon | `src/components/icons/SourceIcon.tsx` |
| 4 | Safe mode за custom code | `src/hooks/useSiteCustomization.tsx` |
| 5 | Аварийно нулиране на custom code | `src/components/settings/SiteCustomizationTab.tsx` |
| 6 | JS sandbox с error handling | `src/hooks/useSiteCustomization.tsx` |

## Приоритет на изпълнение

1. Build грешка (критично — блокира deploy)
2. Дублиран route (сигурност)
3. SourceIcon forwardRef (console warnings)
4. Safe mode + custom code защити (стабилност)


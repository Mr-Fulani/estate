# Выполнение SEO-аудита

Исходный аудит: `seo-audit-2026-09-08.md`. Каждый завершённый пункт проходит проверки и отправляется отдельным коммитом в `main`.

| Пункт | Статус | Проверки |
|---|---|---|
| SEO-03 / P1 | Runtime SITE_URL, проверка origin, динамический robots | Конфигурационные тесты; TypeScript; production-сборка |
| SEO-02 / P1 | Нейтральные defaults, read-only GET пустой установки, явная ошибка при недоступности настроек | Frontend tests, backend tests, TypeScript, ESLint |

| SEO-04 / P1 | Единая сортировка всех страниц sitemap и стабильный порядок при совпадении дат | Регрессия на 101 объекте: полное множество URL без дублей |

| SEO-05 / P1 | Общая валидация пагинации; 404 для некорректных и отсутствующих страниц, уникальный title и OG URL page 2+ | Тесты граничных значений, TypeScript, ESLint |

| SEO-06 / P1 | Индексируются только переводы с заголовком и описанием; единый язык контента, canonical и JSON-LD; пустые переводы новостей отклоняются | Тест неполного EN и полного TR, TypeScript, backend tests |

| SEO-01 / P1 | Единый профиль компании, SEO и тексты в админке, изображения только из настроек; удалены бренд и география из общих исходников | 9 frontend tests, 6 backend tests, TypeScript, ESLint, production build; 36 HTTP-проверок Agency Beta |

| SEO-08 / P2 | Tracking не меняет индексируемость; token/preview получают noindex, private no-store и no-referrer | Тесты классификации query и заголовков proxy, TypeScript, ESLint |

| SEO-09 / P2 | Metadata icon исключён из языковых редиректов; иконка из настроек либо инициалы текущей компании | Регрессия proxy /icon?query, TypeScript |

| SEO-11 / P2 | Активные/default языки и валюты из конфигурации; проект EN/TR без RU; отдельный язык базового объекта, настраиваемая валюта фильтра, категории из БД | 14 frontend tests; 12 backend tests; PostgreSQL: миграции и EN/default roundtrip; TypeScript, ESLint |

| SEO-10 / P2 | Явный тип недвижимости и автора, URL автора, WebSite/publisher/dateModified и видимые крошки с JSON-LD | 16 frontend tests; backend suite: 46 passed, 9 skipped; миграция PostgreSQL; TypeScript, ESLint |

| SEO-12 / P2 | Редактирование slug работает, проверяется формат и занятость; история привязана к ID; старые и числовые URL перенаправляются на текущий slug | PostgreSQL: две смены URL и запрет повторного использования; тесты схем, TypeScript, ESLint |

| SEO-07 / P2 | CMS для SEO-подборок, отдельные локализованные URL, фиксированные фильтры, внутренние ссылки, sitemap и публикация полных переводов | 18 frontend tests + 7 development tests; backend tests; миграция PostgreSQL; TypeScript, ESLint |

| SEO-13 / P2 | Компактный согласованный SQL-снимок, lastModified при редактировании, последний успешный sitemap/503 и разбиение по размеру | Регрессии 101 ресурса, размеров и отказов; интеграция PostgreSQL; TypeScript, ESLint |

| SEO-14 / P2 | Индексация включается только явно в production с проверенным профилем; preview защищён Basic Auth; служебные URL получают noindex | 21 frontend test, TypeScript, ESLint; фактические TLS/host-редиректы проверяются при деплое |

SEO-03: `77424b1`; SEO-02: `0f7d16f`.

Последующие пункты выполняются в порядке технических зависимостей. Публикация на сервере, Search Console и полевые метрики требуют работающего публичного сайта и не считаются проверенными локально.

Дополнительное исправление SEO-05: метаданные разрешаются до отправки заголовков; общая loading-граница публичных страниц удалена, индикатор навигации сохранён. Production-проверка: 45 из 45 некорректных URL вернули HTTP 404 для браузера, Googlebot и Twitterbot. Цена — ожидание данных до первого HTML; влияние оценивается в SEO-17. [Next.js: streaming metadata](https://nextjs.org/docs/app/api-reference/config/next-config-js/htmlLimitedBots).

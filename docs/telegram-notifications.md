# Telegram-уведомления админки

Каждый сотрудник может открыть личный профиль нажатием на карточку аккаунта в сайдбаре `/admin` и самостоятельно привязать приватный Telegram-чат. Привязка выполняется одноразовым `start`-токеном, который хранится в базе только в виде SHA-256-хеша и действует 15 минут.

## Возможности

- общий выключатель Telegram-уведомлений для конкретного сотрудника;
- отдельные уведомления о новых заявках и отзывах;
- тестовая отправка;
- отключение Telegram без отключения аккаунта админки;
- заявки и отзывы сохраняются в CRM независимо от доступности Telegram;
- события подключения, отключения и изменения настроек записываются в аудит.

## Настройка бота

1. Создать бота через `@BotFather` и получить token и username.
2. Сгенерировать отдельный случайный webhook secret длиной не менее 16 символов. Допустимы латинские буквы, цифры, `_` и `-`.
3. Задать backend-переменные окружения:

```env
TELEGRAM_BOT_TOKEN=<bot-token>
TELEGRAM_BOT_USERNAME=<bot-username-without-at-sign>
TELEGRAM_WEBHOOK_SECRET=<separate-random-secret>
ADMIN_PANEL_URL=https://example.com/admin
```

4. Зарегистрировать публичный HTTPS webhook у Telegram:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -d "url=https://example.com/api/v1/telegram/webhook" \
  -d "secret_token=<TELEGRAM_WEBHOOK_SECRET>" \
  -d 'allowed_updates=["message"]'
```

Если backend опубликован за reverse proxy, публичный URL должен вести на FastAPI-маршрут `/api/v1/telegram/webhook`. Не передавайте webhook через закрытый административный proxy, требующий cookie.

После изменения переменных перезапустите API. В профиле должна исчезнуть плашка «Бот пока не настроен на сервере», после чего сотрудник сможет получить одноразовую ссылку и нажать Start в Telegram.

Формат deep link и заголовок проверки webhook соответствуют официальной документации Telegram Bot API: `https://t.me/<bot_username>?start=<parameter>` и `X-Telegram-Bot-Api-Secret-Token`.

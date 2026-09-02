# Заявка → Telegram → предоплата

Продакшен-воркер: `https://soroka-prinesla-lead.testqcqaweb.workers.dev`  
Секреты Cloudflare: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (бот Ари).  
Конфиг: `wrangler.lead.toml`. Формы шлют сюда из `js/form-lib.js`.

Проверено с этой машины (2026-09-02):

- `OPTIONS` → 200, CORS `POST, OPTIONS`
- `GET` → 405 `Method not allowed` — воркер живой, не отдаёт пустую заглушку

Живой POST в Telegram не слал с этой сессии, чтобы не засорять чат. Проверка руками:

1. Откройте https://testqcqaweb.github.io/soroka-prinesla/
2. Отправьте заявку на своё имя с пометкой «тест воронки».
3. В Telegram должно прийти сообщение с пакетом и контактом.
4. Ответ шаблоном: пакет, 50%, реквизиты, ссылка на бриф.

Если сайт пишет «Бот не настроен» (503) — секреты не в воркере:

```sh
cd ~/Projects/soroka-prinesla
npx wrangler secret put TELEGRAM_BOT_TOKEN --config wrangler.lead.toml
npx wrangler secret put TELEGRAM_CHAT_ID --config wrangler.lead.toml
npx wrangler deploy --config wrangler.lead.toml
```

После успешной заявки следующий шаг один: предоплата. Текст не писать до денег.

Автотест без чата: `npm test`. Живой дым в Telegram: `SOROKA_LIVE_TEST=1 npm test`.

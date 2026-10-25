# Telegram-бот

Бот использует существующие Java-сервисы LegalAnalysisService и ReportPdfService.
Пользователь отправляет PDF, DOCX или TXT до 10 МБ в личный чат и получает
сообщение о начале обработки, краткое заключение и PDF. Фото как изображения
не поддерживаются: отправьте документ файлом. Групповые сообщения игнорируются.

## Настройка на сервере

1. Создайте бота командой `/newbot` в официальном https://t.me/BotFather.
2. Сохраните полученный токен только в файле секрета на сервере:

```bash
cd /root/backend_pocket_lawyer
mkdir -p secrets
chmod 700 secrets
nano secrets/telegram_bot_token.txt
chmod 600 secrets/telegram_bot_token.txt
```

Файл должен содержать только токен, без кавычек и имени переменной.
Не отправляйте токен в чат и не коммитьте его. `secrets/*.txt` уже исключены из Git.
Существующий `secrets/gigachat_auth_key.txt` также необходим.

После доставки изменений из GitHub:

```bash
git pull --ff-only
DOMAIN=kaz-rus.uk docker compose -f compose.yaml -f compose.production.yaml -f compose.telegram.yaml up -d --build
DOMAIN=kaz-rus.uk docker compose -f compose.yaml -f compose.production.yaml -f compose.telegram.yaml logs --tail=100 backend
```

Откройте своего бота, отправьте `/start`, затем тестовый договор. Сайт продолжает
работать в том же backend. Для всех последующих обновлений используйте все три
Compose-файла. Не нужны новый домен, входящий порт или webhook.

## Локальный запуск

С Docker: `docker compose -f compose.yaml -f compose.telegram.yaml up -d --build`.
При запуске из IDEA задайте `TELEGRAM_ENABLED=true` и `TELEGRAM_BOT_TOKEN` в
переменных окружения конфигурации запуска. Без `TELEGRAM_ENABLED=true` бот выключен.

## Ограничения первой версии

- Только один процесс polling на один токен: не включайте тот же бот одновременно
  на компьютере и сервере. Иначе Telegram вернёт HTTP 409.
- Для существующего бота с webhook сначала отключите webhook. Приложение
  проверяет его наличие и сообщает об этом в логах; само настройки не меняет.
- Документы обрабатываются последовательно; при нескольких загрузках остальные
  ожидают своей очереди в Telegram. Постоянного хранилища заданий пока нет.
- При перезапуске во время обработки последнее неподтверждённое обновление может
  обработаться повторно. Ошибки анализа не повторяются автоматически: пользователь
  получает сообщение и может заново отправить файл. Результаты и файлы бот не
  сохраняет на диск; они остаются в чате Telegram, файл передаётся в GigaChat.
- Если отправка PDF не удалась, бот сообщит об этом. Для скачивания через сайт
  потребуется повторно загрузить договор на сайт.

API: https://core.telegram.org/bots/api (getUpdates, getFile, sendMessage, sendDocument).

## Структура кода

- `frontend/src/App.jsx` — сборка страницы.
- `frontend/src/components/` — независимые части интерфейса.
- `frontend/src/hooks/useDocumentAnalysis.js` — состояние загрузки и анализа.
- `frontend/src/api/documents.js` — HTTP-запросы и скачивание PDF.
- `AnalysisResponseParser` — преобразование ответа ИИ в данные интерфейса.
- `DocumentValidator` — единые ограничения файла для сайта и Telegram.
- `TelegramClient` — Telegram HTTP API без логирования токена.
- `TelegramMessageHandler` — сценарий приёма файла и отправки результата.
- `TelegramPollingService` — получение обновлений и остановка при выключении приложения.

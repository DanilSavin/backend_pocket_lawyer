package ru.pocketlawyer.telegram;

import jakarta.annotation.PreDestroy;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@ConditionalOnProperty(name = "telegram.enabled", havingValue = "true")
public class TelegramPollingService {
    private static final Logger log = LoggerFactory.getLogger(TelegramPollingService.class);
    private final TelegramClient client;
    private final TelegramMessageHandler handler;
    private Thread worker;

    public TelegramPollingService(TelegramClient client, TelegramMessageHandler handler) {
        this.client = client;
        this.handler = handler;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void start() {
        worker = new Thread(this::poll, "telegram-polling");
        worker.setDaemon(true);
        worker.start();
    }

    private void poll() {
        long offset = 0;
        boolean checked = false;
        while (!Thread.currentThread().isInterrupted()) {
            try {
                if (!checked) {
                    client.checkWebhook();
                    checked = true;
                    log.info("Telegram-бот запущен: long polling, последовательная обработка документов.");
                }
                for (var update : client.updates(offset)) {
                    try { handler.handle(update); }
                    catch (RuntimeException e) { log.warn("Обновление Telegram завершилось ошибкой: {}", e.getClass().getSimpleName()); }
                    offset = update.path("update_id").asLong() + 1;
                }
            } catch (RuntimeException e) {
                log.warn("Telegram polling: {}. Повтор через 15 секунд.",
                        e instanceof TelegramApiException ? e.getMessage() : e.getClass().getSimpleName());
                try { Thread.sleep(15000); }
                catch (InterruptedException interrupted) { Thread.currentThread().interrupt(); }
            }
        }
    }

    @PreDestroy
    public void stop() { if (worker != null) worker.interrupt(); }
}

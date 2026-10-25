package ru.pocketlawyer.telegram;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import ru.pocketlawyer.service.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@ConditionalOnProperty(name = "telegram.enabled", havingValue = "true")
public class TelegramMessageHandler {
    private static final Logger log = LoggerFactory.getLogger(TelegramMessageHandler.class);
    private final TelegramClient telegram;
    private final LegalAnalysisService analysis;
    private final ReportPdfService reports;
    private final DocumentValidator validator;

    public TelegramMessageHandler(TelegramClient telegram, LegalAnalysisService analysis,
                                  ReportPdfService reports, DocumentValidator validator) {
        this.telegram = telegram;
        this.analysis = analysis;
        this.reports = reports;
        this.validator = validator;
    }

    public void handle(JsonNode update) {
        JsonNode message = update.path("message");
        if (!"private".equals(message.path("chat").path("type").asText())) return;
        long chatId = message.path("chat").path("id").asLong();
        JsonNode document = message.path("document");
        if (document.isMissingNode()) {
            telegram.message(chatId, "Пришлите договор файлом PDF, DOCX или TXT до 20 МБ. "
                    + "Я верну краткое заключение и PDF с рисками и рекомендациями. "
                    + "Документ будет передан в GigaChat для анализа. Результат ИИ может содержать ошибки.");
            return;
        }
        try {
            if (document.path("file_size").asLong() > TelegramClient.MAX_DOWNLOAD_BYTES) {
                telegram.message(chatId, "Через Telegram доступны файлы до 20 МБ. Документ до 40 МБ можно загрузить через сайт.");
                return;
            }
            String name = document.path("file_name").asText();
            validator.validate(name, document.path("file_size").asLong());
            telegram.message(chatId, "Документ принят. Проверяем условия договора. Это может занять несколько минут.");
            byte[] data = telegram.download(document.path("file_id").asText());
            var result = analysis.analyze(new TelegramDocument(name, data));
            String risk = switch (result.riskLevel()) {
                case "HIGH" -> "Высокий риск";
                case "LOW" -> "Низкий риск";
                default -> "Требует внимания";
            };
            telegram.message(chatId, "Общая оценка: " + risk + "\n\n" + abbreviate(result.summary(), 2800)
                    + "\n\n" + result.disclaimer());
            try {
                telegram.document(chatId, reports.create(result));
            } catch (RuntimeException e) {
                log.warn("Не удалось отправить PDF в Telegram: {}", e.getClass().getSimpleName());
                telegram.message(chatId, "Заключение готово, но PDF не удалось отправить. Попробуйте скачать отчёт через сайт.");
            }
        } catch (DocumentValidationException e) {
            telegram.message(chatId, e.getMessage());
        } catch (RuntimeException e) {
            // Exceptions from HTTP clients may contain credentials or document data; do not log their messages.
            log.warn("Ошибка обработки документа Telegram: {}", e.getClass().getSimpleName());
            telegram.message(chatId, "Не удалось завершить анализ. Попробуйте отправить файл позже.");
        }
    }

    static String abbreviate(String value, int length) {
        if (value == null) return "Резюме не сформировано.";
        int end = Math.min(value.length(), length);
        if (end > 0 && Character.isHighSurrogate(value.charAt(end - 1))) end--;
        return value.substring(0, end) + (end < value.length() ? "…" : "");
    }
}

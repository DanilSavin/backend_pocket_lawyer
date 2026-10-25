package ru.pocketlawyer.telegram;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import java.io.IOException;
import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;

@Component
@ConditionalOnProperty(name = "telegram.enabled", havingValue = "true")
public class TelegramClient {
    public static final int MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();
    private final ObjectMapper json;
    private final String token;

    public TelegramClient(ObjectMapper json, @Value("${telegram.bot-token:}") String token) {
        this.json = json;
        this.token = token.trim();
        if (!this.token.matches("[0-9]+:[A-Za-z0-9_-]+")) {
            throw new IllegalArgumentException("Для Telegram укажите telegram.bot-token в Docker secret или TELEGRAM_BOT_TOKEN.");
        }
    }

    public JsonNode updates(long offset) {
        return call("getUpdates", Map.of("offset", offset, "timeout", 25, "limit", 1,
                "allowed_updates", List.of("message")));
    }

    public void checkWebhook() {
        if (!call("getWebhookInfo", Map.of()).path("url").asText().isBlank()) {
            throw new TelegramApiException("У бота установлен webhook. Отключите его для работы через long polling.");
        }
    }

    public void message(long chatId, String text) {
        call("sendMessage", Map.of("chat_id", chatId, "text", text));
    }

    public byte[] download(String fileId) {
        JsonNode file = call("getFile", Map.of("file_id", fileId));
        String path = file.path("file_path").asText();
        if (!path.matches("[A-Za-z0-9_./-]+") || path.contains("..") || path.startsWith("/")
                || file.path("file_size").asLong() > MAX_DOWNLOAD_BYTES) {
            throw new TelegramApiException("Telegram не вернул подходящий файл размером до 20 МБ.");
        }
        var request = HttpRequest.newBuilder(URI.create("https://api.telegram.org/file/bot" + token + "/" + path))
                .timeout(Duration.ofSeconds(60)).GET().build();
        try {
            var response = http.send(request, HttpResponse.BodyHandlers.ofInputStream());
            try (var input = response.body()) {
                if (response.statusCode() != 200) throw new TelegramApiException("Не удалось скачать файл из Telegram.");
                byte[] data = input.readNBytes(MAX_DOWNLOAD_BYTES + 1);
                if (data.length > MAX_DOWNLOAD_BYTES) throw new TelegramApiException("Файл больше 20 МБ.");
                return data;
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new TelegramApiException("Загрузка прервана.");
        } catch (IOException e) { throw new TelegramApiException("Ошибка соединения при загрузке файла."); }
    }

    public void document(long chatId, byte[] pdf) {
        String boundary = "PocketLawyer" + UUID.randomUUID();
        String prefix = "--" + boundary + "\r\nContent-Disposition: form-data; name=\"chat_id\"\r\n\r\n" + chatId
                + "\r\n--" + boundary + "\r\nContent-Disposition: form-data; name=\"document\"; filename=\"legal-analysis.pdf\""
                + "\r\nContent-Type: application/pdf\r\n\r\n";
        send("sendDocument", "multipart/form-data; boundary=" + boundary,
                HttpRequest.BodyPublishers.ofByteArrays(List.of(prefix.getBytes(StandardCharsets.UTF_8), pdf,
                        ("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8))));
    }

    private JsonNode call(String method, Map<String, ?> body) {
        try {
            return send(method, "application/json", HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)));
        } catch (IOException e) { throw new TelegramApiException("Не удалось подготовить запрос Telegram."); }
    }

    private JsonNode send(String method, String type, HttpRequest.BodyPublisher body) {
        var request = HttpRequest.newBuilder(URI.create("https://api.telegram.org/bot" + token + "/" + method))
                .timeout(Duration.ofSeconds(65)).header("Content-Type", type).POST(body).build();
        try {
            var response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() != 200) throw new TelegramApiException("Telegram HTTP " + response.statusCode());
            JsonNode result = json.readTree(response.body());
            if (!result.path("ok").asBoolean()) throw new TelegramApiException("Telegram отклонил запрос.");
            return result.path("result");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new TelegramApiException("Запрос Telegram прерван.");
        } catch (IOException e) { throw new TelegramApiException("Ошибка соединения с Telegram."); }
    }
}

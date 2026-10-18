package ru.pocketlawyer.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import ru.pocketlawyer.api.AnalysisResponse;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class LegalAnalysisService {
    private static final Logger log = LoggerFactory.getLogger(LegalAnalysisService.class);
    private final GigaChatClient gigaChat;
    private final ObjectMapper json;
    private final Resource promptResource;

    public LegalAnalysisService(GigaChatClient gigaChat, ObjectMapper json,
                                @Value("classpath:prompts/contract-analysis-prompt.txt") Resource promptResource) {
        this.gigaChat = gigaChat;
        this.json = json;
        this.promptResource = promptResource;
    }

    public AnalysisResponse analyze(MultipartFile file) {
        String modelAnswer = gigaChat.analyzeContract(file, loadPrompt());
        try {
            JsonNode answer = json.readTree(extractJson(modelAnswer));
            List<String> strengths = new ArrayList<>();
            answer.path("strengths").forEach(item -> strengths.add(item.asText()));
            List<AnalysisResponse.Finding> findings = new ArrayList<>();
            answer.path("weaknesses").forEach(item -> findings.add(new AnalysisResponse.Finding(
                    item.path("title").asText("Условие требует проверки"),
                    severity(item.path("severity").asText()),
                    item.path("description").asText(),
                    item.path("recommendation").asText())));
            String overallRiskLevel = overallRiskLevel(answer.path("riskLevel").asText());
            log.info("Структурированный ответ GigaChat обработан: strengths={}, weaknesses={}, riskLevel={}",
                    strengths.size(), findings.size(), overallRiskLevel);
            return new AnalysisResponse(file.getOriginalFilename(), file.getSize(),
                    answer.path("summary").asText("GigaChat не сформировал резюме."), strengths, overallRiskLevel, findings,
                    "Информационный анализ на основе ИИ, не является юридической консультацией. Для значимой сделки обратитесь к юристу.");
        } catch (IOException e) {
            throw new GigaChatException("GigaChat вернул ответ в неожиданном формате. Повторите запрос.", e);
        }
    }

    private String extractJson(String value) {
        int first = value.indexOf('{');
        int last = value.lastIndexOf('}');
        if (first < 0 || last <= first) throw new GigaChatException("GigaChat не вернул структурированное заключение. Повторите запрос.");
        return value.substring(first, last + 1);
    }
    private String severity(String value) { return switch (value) { case "HIGH", "MEDIUM", "LOW" -> value; default -> "MEDIUM"; }; }

    private String overallRiskLevel(String value) {
        return switch (value) {
            case "HIGH", "MEDIUM", "LOW" -> value;
            default -> "MEDIUM";
        };
    }

    private String loadPrompt() {
        try (var inputStream = promptResource.getInputStream()) {
            return new String(inputStream.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Не удалось загрузить промт анализа договора.", e);
        }
    }
}

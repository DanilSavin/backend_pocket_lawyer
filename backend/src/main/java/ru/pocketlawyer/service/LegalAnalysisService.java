package ru.pocketlawyer.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import ru.pocketlawyer.api.AnalysisResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

@Service
public class LegalAnalysisService {
    private final GigaChatClient gigaChat;
    private final AnalysisResponseParser parser;
    private final DocumentValidator validator;
    private final String prompt;

    public LegalAnalysisService(GigaChatClient gigaChat, AnalysisResponseParser parser, DocumentValidator validator,
                                @Value("classpath:prompts/contract-analysis-prompt.txt") Resource promptResource) {
        this.gigaChat = gigaChat;
        this.parser = parser;
        this.validator = validator;
        try (var stream = promptResource.getInputStream()) {
            this.prompt = new String(stream.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new IllegalStateException("Не удалось загрузить промт анализа договора.", e);
        }
    }

    public AnalysisResponse analyze(MultipartFile file) {
        validator.validate(file.getOriginalFilename(), file.getSize());
        return parser.parse(file, gigaChat.analyzeContract(file, prompt));
    }
}

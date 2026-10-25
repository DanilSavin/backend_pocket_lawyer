package ru.pocketlawyer.service;

import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class DocumentValidator {
    public static final int MAX_BYTES = 40 * 1024 * 1024;

    public void validate(String name, long size) {
        if (size <= 0 || size > MAX_BYTES) {
            throw new DocumentValidationException("Выберите непустой файл размером до 40 МБ.");
        }
        if (name == null || !name.toLowerCase(Locale.ROOT).matches(".*\\.(pdf|docx|txt)$")) {
            throw new DocumentValidationException("Поддерживаются только PDF, DOCX и TXT.");
        }
    }
}

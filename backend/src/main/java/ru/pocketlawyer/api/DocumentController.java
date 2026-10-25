package ru.pocketlawyer.api;

import ru.pocketlawyer.service.LegalAnalysisService;
import ru.pocketlawyer.service.GigaChatException;
import ru.pocketlawyer.service.ReportPdfService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.IOException;
import ru.pocketlawyer.service.DocumentValidationException;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    private static final Logger log = LoggerFactory.getLogger(DocumentController.class);
    private final LegalAnalysisService analysisService;
    private final ReportPdfService reportPdfService;

    public DocumentController(LegalAnalysisService analysisService, ReportPdfService reportPdfService) {
        this.analysisService = analysisService;
        this.reportPdfService = reportPdfService;
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public AnalysisResponse analyze(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) throw new ApiException("Выберите непустой файл.");
        log.info("Получен документ для анализа: name={}, sizeBytes={}, contentType={}",
                file.getOriginalFilename(), file.getSize(), file.getContentType());
        return analysisService.analyze(file);
    }

    @PostMapping(value = "/report", consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_PDF_VALUE)
    public org.springframework.http.ResponseEntity<byte[]> report(@RequestBody AnalysisResponse analysis) {
        byte[] pdf = reportPdfService.create(analysis);
        return org.springframework.http.ResponseEntity.ok()
                .header("Content-Disposition", "attachment; filename=legal-analysis.pdf")
                .header("Content-Type", MediaType.APPLICATION_PDF_VALUE)
                .body(pdf);
    }

    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(ApiException.class)
    public ErrorResponse handle(ApiException e) { return new ErrorResponse(e.getMessage()); }

    @ResponseStatus(HttpStatus.BAD_GATEWAY)
    @ExceptionHandler(GigaChatException.class)
    public ErrorResponse handle(GigaChatException e) {
        log.warn("Ошибка интеграции GigaChat: {}", e.getMessage());
        return new ErrorResponse(e.getMessage());
    }

    public record ErrorResponse(String message) {}
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    @ExceptionHandler(DocumentValidationException.class)
    public ErrorResponse handle(DocumentValidationException e) { return new ErrorResponse(e.getMessage()); }
    public static class ApiException extends RuntimeException { public ApiException(String message) { super(message); } }
}

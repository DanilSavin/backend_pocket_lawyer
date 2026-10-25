package ru.pocketlawyer.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;
import static org.junit.jupiter.api.Assertions.*;

class AnalysisResponseParserTest {
    @Test void keepsOverallRiskIndependentOfIndividualFindings() {
        var parser = new AnalysisResponseParser(new ObjectMapper());
        var file = new MockMultipartFile("file", "contract.txt", "text/plain", new byte[]{1});
        var result = parser.parse(file, """
            ```json
            {"summary":"Тест","riskLevel":"LOW","strengths":[],"weaknesses":[
              {"title":"Риск","severity":"HIGH","clause":"4.2","quote":"Цитата",
               "explanation":"Объяснение","suggestedRevision":"Правка"}]}
            ```
            """);
        assertEquals("LOW", result.riskLevel());
        assertEquals("4.2", result.findings().get(0).clause());
        assertEquals("Правка", result.findings().get(0).suggestedRevision());
    }

    @Test void validatorRejectsUnsupportedAndEmptyFiles() {
        var validator = new DocumentValidator();
        assertThrows(DocumentValidationException.class, () -> validator.validate("contract.exe", 100));
        assertThrows(DocumentValidationException.class, () -> validator.validate("contract.pdf", 0));
        assertDoesNotThrow(() -> validator.validate("contract.PDF", DocumentValidator.MAX_BYTES));
    }
}

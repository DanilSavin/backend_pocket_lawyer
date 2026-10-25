package ru.pocketlawyer.telegram;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import ru.pocketlawyer.api.AnalysisResponse;
import ru.pocketlawyer.service.*;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

class TelegramMessageHandlerTest {
    private final TelegramClient client = mock(TelegramClient.class);
    private final LegalAnalysisService analysis = mock(LegalAnalysisService.class);
    private final ReportPdfService pdf = mock(ReportPdfService.class);
    private final TelegramMessageHandler handler = new TelegramMessageHandler(client, analysis, pdf, new DocumentValidator());
    private final ObjectMapper json = new ObjectMapper();

    @Test void sendsSummaryAndPdfToTheOriginatingChat() throws Exception {
        var result = new AnalysisResponse("contract.txt", 4, "Резюме", List.of(), "LOW", List.of(), "Оговорка");
        when(client.download("document-id")).thenReturn(new byte[]{1, 2, 3, 4});
        when(analysis.analyze(any())).thenReturn(result);
        when(pdf.create(result)).thenReturn(new byte[]{5, 6});
        handler.handle(json.readTree("""
            {"message":{"chat":{"id":123,"type":"private"},"document":{
              "file_name":"contract.txt","file_size":4,"file_id":"document-id"}}}
            """));
        verify(client).message(eq(123L), contains("Документ принят"));
        verify(client).message(eq(123L), contains("Низкий риск"));
        verify(client).document(eq(123L), eq(new byte[]{5, 6}));
        verify(analysis).analyze(argThat(file -> file.getOriginalFilename().equals("contract.txt") && file.getSize() == 4));
    }

    @Test void rejectsOversizedDocumentsBeforeDownload() throws Exception {
        handler.handle(json.readTree("""
            {"message":{"chat":{"id":123,"type":"private"},"document":{
              "file_name":"contract.pdf","file_size":10485761,"file_id":"document-id"}}}
            """));
        verify(client).message(eq(123L), contains("10 МБ"));
        verify(client, never()).download(anyString());
        verifyNoInteractions(analysis, pdf);
    }

    @Test void ignoresGroups() throws Exception {
        handler.handle(json.readTree("{\"message\":{\"chat\":{\"id\":-123,\"type\":\"group\"}}}"));
        verifyNoInteractions(client, analysis, pdf);
    }

    @Test void hidesProviderErrorsFromUsers() throws Exception {
        when(client.download("id")).thenThrow(new TelegramApiException("internal credentials"));
        handler.handle(json.readTree("""
            {"message":{"chat":{"id":123,"type":"private"},"document":{
              "file_name":"contract.txt","file_size":4,"file_id":"id"}}}
            """));
        verify(client).message(eq(123L), startsWith("Не удалось завершить анализ"));
        verifyNoInteractions(analysis, pdf);
    }

    @Test void truncationDoesNotSplitSurrogatePairs() {
        assertEquals("a…", TelegramMessageHandler.abbreviate("a😀b", 2));
    }
}

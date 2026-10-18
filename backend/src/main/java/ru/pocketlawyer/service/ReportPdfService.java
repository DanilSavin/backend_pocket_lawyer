package ru.pocketlawyer.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.stereotype.Service;
import ru.pocketlawyer.api.AnalysisResponse;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

@Service
public class ReportPdfService {
    private static final float MARGIN = 48;
    private static final float BOTTOM_MARGIN = 54;
    private static final List<Path> FONT_PATHS = List.of(
            Path.of("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
            Path.of("C:/Windows/Fonts/arial.ttf"));

    public byte[] create(AnalysisResponse analysis) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDType0Font regular = loadFont(document);
            PdfWriter writer = new PdfWriter(document, regular);

            writer.heading("КАРМАННЫЙ ЮРИСТ", 22, new Color(23, 68, 155));
            writer.paragraph("Отчёт по анализу договора", 13, new Color(17, 21, 47));
            writer.paragraph("Файл: " + value(analysis.fileName(), "Документ"), 10, Color.DARK_GRAY);
            writer.spacer(10);

            writer.heading("Общая оценка: " + riskLabel(analysis.riskLevel()), 16, riskColor(analysis.riskLevel()));
            writer.paragraph(value(analysis.summary(), "Резюме не сформировано."), 11, Color.DARK_GRAY);

            if (analysis.strengths() != null && !analysis.strengths().isEmpty()) {
                writer.spacer(10);
                writer.heading("Сильные стороны", 15, new Color(49, 131, 68));
                for (String strength : analysis.strengths()) writer.bullet(value(strength, "Не указано"));
            }

            writer.spacer(10);
            writer.heading("Риски и рекомендации", 15, new Color(23, 68, 155));
            if (analysis.findings() == null || analysis.findings().isEmpty()) {
                writer.paragraph("Существенные слабые места не выделены.", 11, Color.DARK_GRAY);
            } else {
                for (AnalysisResponse.Finding finding : analysis.findings()) {
                    writer.spacer(6);
                    writer.heading(value(finding.title(), "Условие требует проверки") + " — " + riskLabel(finding.severity()),
                            13, riskColor(finding.severity()));
                    writer.paragraph("Пункт: " + value(finding.clause(), "не указан"), 10, Color.DARK_GRAY);
                    if (!blank(finding.quote())) writer.paragraph("Цитата: «" + finding.quote() + "»", 10, new Color(50, 50, 50));
                    writer.paragraph(value(finding.description(), "Описание не сформировано."), 11, Color.DARK_GRAY);
                    writer.paragraph("Что сделать: " + value(finding.recommendation(), "Проверьте это условие."), 11, new Color(23, 68, 155));
                    if (!blank(finding.suggestedRevision())) {
                        writer.paragraph("Вариант редакции: " + finding.suggestedRevision(), 10, Color.DARK_GRAY);
                    }
                }
            }

            writer.spacer(12);
            writer.paragraph(value(analysis.disclaimer(), "Информационный анализ на основе ИИ, не является юридической консультацией."),
                    9, Color.GRAY);
            writer.close();
            document.save(output);
            return output.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Не удалось сформировать PDF-отчёт.", e);
        }
    }

    private PDType0Font loadFont(PDDocument document) throws IOException {
        for (Path path : FONT_PATHS) {
            if (Files.isRegularFile(path)) {
                try (InputStream input = Files.newInputStream(path)) {
                    return PDType0Font.load(document, input);
                }
            }
        }
        throw new IOException("Не найден шрифт с поддержкой кириллицы.");
    }

    private String riskLabel(String value) {
        return switch (value == null ? "" : value) {
            case "HIGH" -> "Высокий риск";
            case "LOW" -> "Низкий риск";
            default -> "Требует внимания";
        };
    }

    private Color riskColor(String value) {
        return switch (value == null ? "" : value) {
            case "HIGH" -> new Color(190, 37, 37);
            case "LOW" -> new Color(49, 131, 68);
            default -> new Color(150, 100, 0);
        };
    }

    private boolean blank(String value) { return value == null || value.isBlank(); }
    private String value(String value, String fallback) { return blank(value) ? fallback : value.replaceAll("\\s+", " ").trim(); }

    private static final class PdfWriter {
        private final PDDocument document;
        private final PDType0Font font;
        private PDPageContentStream stream;
        private float y;

        private PdfWriter(PDDocument document, PDType0Font font) throws IOException {
            this.document = document;
            this.font = font;
            nextPage();
        }

        private void heading(String text, float size, Color color) throws IOException { write(text, size, color, size * 1.35f); }
        private void paragraph(String text, float size, Color color) throws IOException { write(text, size, color, size * 1.45f); }
        private void bullet(String text) throws IOException { write("• " + text, 11, Color.DARK_GRAY, 16); }
        private void spacer(float height) throws IOException { ensureSpace(height); y -= height; }

        private void write(String text, float size, Color color, float leading) throws IOException {
            for (String line : wrap(text, size)) {
                ensureSpace(leading);
                stream.beginText();
                stream.setFont(font, size);
                stream.setNonStrokingColor(color);
                stream.newLineAtOffset(MARGIN, y);
                stream.showText(line);
                stream.endText();
                y -= leading;
            }
        }

        private List<String> wrap(String text, float size) throws IOException {
            String clean = text == null ? "" : text.replaceAll("\\s+", " ").trim();
            List<String> lines = new ArrayList<>();
            StringBuilder line = new StringBuilder();
            for (String word : clean.split(" ")) {
                String candidate = line.isEmpty() ? word : line + " " + word;
                if (!line.isEmpty() && font.getStringWidth(candidate) / 1000 * size > PDRectangle.A4.getWidth() - MARGIN * 2) {
                    lines.add(line.toString());
                    line.setLength(0);
                    line.append(word);
                } else {
                    line.setLength(0);
                    line.append(candidate);
                }
            }
            if (!line.isEmpty()) lines.add(line.toString());
            return lines.isEmpty() ? List.of("") : lines;
        }

        private void ensureSpace(float height) throws IOException { if (y - height < BOTTOM_MARGIN) nextPage(); }

        private void nextPage() throws IOException {
            if (stream != null) stream.close();
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            stream = new PDPageContentStream(document, page);
            y = page.getMediaBox().getHeight() - MARGIN;
        }

        private void close() throws IOException { if (stream != null) stream.close(); }
    }
}

package ru.pocketlawyer.telegram;

import org.springframework.web.multipart.MultipartFile;
import java.io.*;
import java.nio.file.Files;

/** In-memory adapter so the website and bot use the same analysis service. */
public record TelegramDocument(String filename, byte[] content) implements MultipartFile {
    public String getName() { return "file"; }
    public String getOriginalFilename() { return filename; }
    public String getContentType() {
        String name = filename.toLowerCase(java.util.Locale.ROOT);
        if (name.endsWith(".pdf")) return "application/pdf";
        if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        return "text/plain";
    }
    public boolean isEmpty() { return content.length == 0; }
    public long getSize() { return content.length; }
    public byte[] getBytes() { return content; }
    public InputStream getInputStream() { return new ByteArrayInputStream(content); }
    public void transferTo(File destination) throws IOException { Files.write(destination.toPath(), content); }
}

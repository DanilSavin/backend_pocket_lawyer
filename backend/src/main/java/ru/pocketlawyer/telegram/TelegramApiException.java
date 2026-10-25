package ru.pocketlawyer.telegram;

/** Never include a request URL: Telegram URLs contain the bot token. */
public class TelegramApiException extends RuntimeException {
    public TelegramApiException(String message) { super(message); }
}

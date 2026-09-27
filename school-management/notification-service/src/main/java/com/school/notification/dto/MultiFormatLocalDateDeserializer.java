package com.school.notification.dto;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Flexible LocalDate deserializer supporting multiple common date formats:
 * yyyy-MM-dd, dd-MM-yyyy, dd/MM/yyyy, yyyy/MM/dd, etc.
 */
public class MultiFormatLocalDateDeserializer extends JsonDeserializer<LocalDate> {

    private static final DateTimeFormatter[] FORMATTERS = new DateTimeFormatter[] {
            DateTimeFormatter.ISO_LOCAL_DATE,                    // 2026-09-27
            DateTimeFormatter.ofPattern("dd-MM-yyyy"),           // 27-09-2026
            DateTimeFormatter.ofPattern("d-M-yyyy"),             // 7-9-2026
            DateTimeFormatter.ofPattern("dd/MM/yyyy"),           // 27/09/2026
            DateTimeFormatter.ofPattern("d/M/yyyy"),             // 7/9/2026
            DateTimeFormatter.ofPattern("yyyy/MM/dd")            // 2026/09/27
    };

    @Override
    public LocalDate deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        String text = p.getText();
        if (text == null || text.trim().isEmpty()) {
            return null;
        }
        text = text.trim();
        for (DateTimeFormatter formatter : FORMATTERS) {
            try {
                return LocalDate.parse(text, formatter);
            } catch (DateTimeParseException ignored) {
            }
        }
        throw new IllegalArgumentException("Invalid date format: '" + text + "'. Supported formats: yyyy-MM-dd, dd-MM-yyyy");
    }
}

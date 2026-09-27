package com.school.academic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkUploadResult {
    private int totalRows;
    private int successful;
    private int updated;
    private int failed;
    @Builder.Default
    private int skipped = 0;
    @Builder.Default
    private List<BulkUploadError> errors = new ArrayList<>();
    private String message;

    public int getSuccessfulRows() {
        return successful;
    }

    public int getUpdatedRows() {
        return updated;
    }

    public int getFailedRows() {
        return failed;
    }

    public int getSkippedRows() {
        return skipped;
    }
}

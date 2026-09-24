package com.school.fee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Result returned upon billing bulk upload attempt.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkUploadBillingResult {
    private boolean success;
    private int totalRows;
    private int insertedCount;
    private int errorCount;
    private String message;
    private List<BulkUploadBillingError> errors;
    private String errorExcelBase64;
}

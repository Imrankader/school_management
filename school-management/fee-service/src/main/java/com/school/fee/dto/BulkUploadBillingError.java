package com.school.fee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Individual validation error details for billing bulk upload.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkUploadBillingError {
    private int row;
    private String studentName;
    private String admissionNumber;
    private String className;
    private String errorType;
    private String errorMessage;
    private Integer duplicateWithRow;
}

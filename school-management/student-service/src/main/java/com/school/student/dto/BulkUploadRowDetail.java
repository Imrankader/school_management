package com.school.student.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkUploadRowDetail {
    private int rowNumber;
    private String admissionNumber;
    private String studentName;
    private String className;
    private String action; // "ADDED", "UPDATED", "UNCHANGED", "ERROR"
    private String detail;
}

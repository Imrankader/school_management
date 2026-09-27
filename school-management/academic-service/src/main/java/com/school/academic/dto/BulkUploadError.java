package com.school.academic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkUploadError {
    private int rowNumber;
    private String admissionNumber;
    private String studentName;
    private String className;
    private String section;
    private String subject;
    private String exam;
    private String issue;
    private String details;

    public String getSubjectName() {
        return subject;
    }

    public String getExamName() {
        return exam;
    }
}

package com.school.academic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarkDTO {
    private Long id;
    private Long studentId;
    private String admissionNumber;
    private String studentName;
    private String className;
    private String section;
    private Long examId;
    private String examName;
    private Long subjectId;
    private String subjectName;
    private Double marksObtained;
    private Double maxMarks;
    private String grade;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

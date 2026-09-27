package com.school.academic.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MarkBatchRequest {
    private String className;
    private String section;
    private String examName;
    private String subjectName;
    private Double maxMarks;
    private List<MarkDTO> marks;
}

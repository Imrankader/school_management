package com.school.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Minimal student information retrieved from student-service.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentInfoDTO {
    private Long id;
    private String admissionNumber;
    private String name;
    private String className;
    private String section;
}

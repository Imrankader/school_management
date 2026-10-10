package com.school.academic.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class StudentInfoDTO {
    private Long id;
    private String admissionNumber;
    private String name;
    private String className;
    private String section;
    private Boolean isActive;
    /** Primary contact shown in the marks template. */
    private String contactNumber;
    /** Every mobile number on record for the student (contact / father / mother / guardian / login). */
    @Builder.Default
    private List<String> mobileNumbers = new ArrayList<>();
}

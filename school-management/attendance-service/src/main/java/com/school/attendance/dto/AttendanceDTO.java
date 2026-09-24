package com.school.attendance.dto;

import com.school.common.enums.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * DTO for Attendance create/update and response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceDTO {

    private Long id;

    @NotNull(message = "Person Type is required")
    private com.school.common.enums.PersonType personType;

    @NotNull(message = "Person ID is required")
    private Long personId;

    @NotNull(message = "Date is required")
    private LocalDate date;

    @NotNull(message = "Status is required")
    private AttendanceStatus status;
}

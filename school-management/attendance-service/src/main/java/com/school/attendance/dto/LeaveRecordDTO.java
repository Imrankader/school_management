package com.school.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Enriched Leave Record DTO returned to Teacher and Admin portals.
 * Contains student identification details resolved cross-service from student-service.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeaveRecordDTO {

    /** Sequential/unique record identifier */
    private Long recordId;

    /** Alias for backward compatibility */
    private Long id;

    private Long studentId;
    private String studentName;
    private String admissionNumber;
    private String className;
    private String section;

    /** Single-day leave date */
    private LocalDate leaveDate;

    /** Aliases for backward compatibility */
    private LocalDate startDate;
    private LocalDate endDate;

    private String reason;

    /** Submission timestamp */
    private LocalDateTime submittedAt;

    /** Alias for backward compatibility */
    private LocalDateTime createdAt;

    /** Always RECORDED — no approval/rejection workflow */
    private String status;
}

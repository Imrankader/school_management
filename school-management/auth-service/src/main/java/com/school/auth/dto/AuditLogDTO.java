package com.school.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDTO {
    private Long id;
    private String actorEmail;
    private String action;
    private String targetEmail;
    private String targetRole;
    private String details;
    private LocalDateTime createdAt;
}

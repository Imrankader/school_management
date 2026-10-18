package com.school.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Admin-controlled on/off switch for a portal module (e.g. "can Teachers see Homework").
 * Absence of a row for a given (role, moduleKey) means enabled — rows only need to exist
 * to record a change from the default.
 */
@Entity
@Table(name = "feature_toggles", uniqueConstraints = @UniqueConstraint(columnNames = {"role", "module_key"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureToggle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String role;

    @Column(name = "module_key", nullable = false)
    private String moduleKey;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PreUpdate
    @PrePersist
    public void touch() {
        updatedAt = LocalDateTime.now();
    }
}

package com.school.auth.entity;

import com.school.common.enums.Role;
import jakarta.persistence.*;
import lombok.*;

/**
 * User entity representing system users (Admin, Teacher, Parent).
 * For PARENT role, studentId holds the ID of the student in student-service.
 * For TEACHER role, assignedClass and assignedSection indicate the teacher's class assignment.
 */
@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    /**
     * For PARENT role only: the ID of the student (in student-service) this
     * parent is assigned to. Null for ADMIN and TEACHER users.
     */
    @Column(name = "student_id")
    private Long studentId;

    /**
     * For TEACHER role: The assigned class (e.g. "Class 10").
     */
    @Column(name = "assigned_class")
    private String assignedClass;

    /**
     * For TEACHER role: The assigned section (e.g. "A").
     */
    @Column(name = "assigned_section")
    private String assignedSection;
}

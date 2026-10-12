package com.school.attendance.repository;

import com.school.attendance.entity.TeacherLeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeacherLeaveRequestRepository extends JpaRepository<TeacherLeaveRequest, Long> {
    List<TeacherLeaveRequest> findByTeacherIdOrderByCreatedAtDesc(Long teacherId);
    List<TeacherLeaveRequest> findAllByOrderByCreatedAtDesc();
}

package com.school.attendance.repository;

import com.school.attendance.entity.LeaveReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveReasonRepository extends JpaRepository<LeaveReason, Long> {

    /** All active reasons for the parent dropdown */
    List<LeaveReason> findByActiveTrueOrderByEnglishReasonAsc();

    /** Check if any leave request references this reason text */
    boolean existsByEnglishReason(String englishReason);
}

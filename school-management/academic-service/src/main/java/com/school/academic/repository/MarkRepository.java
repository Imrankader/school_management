package com.school.academic.repository;

import com.school.academic.entity.Mark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarkRepository extends JpaRepository<Mark, Long> {

    List<Mark> findByStudentId(Long studentId);

    List<Mark> findByExamId(Long examId);

    Optional<Mark> findFirstByStudentIdAndSubjectNameIgnoreCaseAndExamNameIgnoreCase(
            Long studentId, String subjectName, String examName);

    Optional<Mark> findFirstByAdmissionNumberAndSubjectNameIgnoreCaseAndExamNameIgnoreCase(
            String admissionNumber, String subjectName, String examName);

    @Query("SELECT m FROM Mark m WHERE " +
           "(:className IS NULL OR :className = '' OR LOWER(m.className) = LOWER(:className) OR LOWER(m.className) = LOWER(CONCAT('Class ', :className))) AND " +
           "(:section IS NULL OR :section = '' OR LOWER(m.section) = LOWER(:section)) AND " +
           "(:examName IS NULL OR :examName = '' OR LOWER(m.examName) = LOWER(:examName)) AND " +
           "(:subjectName IS NULL OR :subjectName = '' OR LOWER(m.subjectName) = LOWER(:subjectName)) " +
           "ORDER BY m.className, m.section, m.admissionNumber, m.id")
    List<Mark> searchMarks(
            @Param("className") String className,
            @Param("section") String section,
            @Param("examName") String examName,
            @Param("subjectName") String subjectName);
}

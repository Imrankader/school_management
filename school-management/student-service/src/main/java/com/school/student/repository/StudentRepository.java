package com.school.student.repository;

import com.school.student.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Student entity.
 */
@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByAdmissionNumber(String admissionNumber);

    List<Student> findByClassName(String className);

    List<Student> findByParentId(Long parentId);

    List<Student> findByAdmissionNumberIn(java.util.Collection<String> admissionNumbers);

    boolean existsByAdmissionNumber(String admissionNumber);

    List<Student> findByNameIgnoreCase(String name);

    default boolean isDuplicateStudent(String name, String fatherName, String motherName, String guardianName, String address, java.time.LocalDate dateOfBirth) {
        if (name == null) return false;
        List<Student> students = findByNameIgnoreCase(name.trim());
        for (Student s : students) {
            if (matches(s, fatherName, motherName, guardianName, address, dateOfBirth)) {
                return true;
            }
        }
        return false;
    }

    default boolean isDuplicateStudentExcludingId(Long id, String name, String fatherName, String motherName, String guardianName, String address, java.time.LocalDate dateOfBirth) {
        if (name == null) return false;
        List<Student> students = findByNameIgnoreCase(name.trim());
        for (Student s : students) {
            if (!s.getId().equals(id) && matches(s, fatherName, motherName, guardianName, address, dateOfBirth)) {
                return true;
            }
        }
        return false;
    }

    default boolean matches(Student s, String fatherName, String motherName, String guardianName, String address, java.time.LocalDate dateOfBirth) {
        return normalizeString(s.getFatherName()).equals(normalizeString(fatherName)) &&
               normalizeString(s.getMotherName()).equals(normalizeString(motherName)) &&
               normalizeString(s.getGuardianName()).equals(normalizeString(guardianName)) &&
               normalizeString(s.getAddress()).equals(normalizeString(address)) &&
               java.util.Objects.equals(s.getDateOfBirth(), dateOfBirth);
    }

    default String normalizeString(String val) {
        if (val == null) return "";
        return val.trim().toLowerCase();
    }
}

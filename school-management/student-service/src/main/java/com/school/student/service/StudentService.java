package com.school.student.service;

import com.school.common.exception.BadRequestException;
import com.school.common.exception.ResourceNotFoundException;
import com.school.student.dto.StudentDTO;
import com.school.student.entity.Student;
import com.school.student.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Business logic for Student management.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class StudentService {

    private final StudentRepository studentRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public Page<StudentDTO> searchStudents(String search, String status, Pageable pageable) {
        Specification<Student> spec = Specification.where(null);
        if (search != null && !search.isBlank()) {
            String likeSearch = "%" + search.toLowerCase() + "%";
            spec = spec.and((root, query, cb) -> cb.or(
                cb.like(cb.lower(root.get("name")), likeSearch),
                cb.like(cb.lower(root.get("admissionNumber")), likeSearch),
                cb.like(cb.lower(root.get("className")), likeSearch)
            ));
        }
        if ("active".equalsIgnoreCase(status)) {
            spec = spec.and((root, query, cb) -> cb.isTrue(root.get("isActive")));
        } else if ("inactive".equalsIgnoreCase(status)) {
            spec = spec.and((root, query, cb) -> cb.isFalse(root.get("isActive")));
        }
        return studentRepository.findAll(spec, pageable).map(this::toDTO);
    }

    public long countTotalStudents() { return studentRepository.count(); }
    public long countActiveStudents() { return studentRepository.countByIsActiveTrue(); }
    public long countInactiveStudents() { return studentRepository.countByIsActiveFalse(); }

    public List<StudentDTO> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::toDTO)
                .toList();
    }

    public List<StudentDTO> getActiveStudentsByClass(String className) {
        return studentRepository.findByClassNameAndIsActiveTrue(className).stream()
                .map(this::toDTO)
                .sorted(java.util.Comparator.comparing(StudentDTO::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    public List<String> getDistinctClasses() {
        return studentRepository.findDistinctClassNames();
    }

    public java.util.Map<String, List<StudentDTO>> getActiveStudentsGroupedByClass() {
        return studentRepository.findByIsActiveTrue().stream()
                .filter(s -> s.getClassName() != null && !s.getClassName().isBlank())
                .map(this::toDTO)
                .collect(java.util.stream.Collectors.groupingBy(StudentDTO::getClassName));
    }

    public List<StudentDTO> getStudentsByParent(Long parentId) {
        return studentRepository.findByParentId(parentId).stream()
                .map(this::toDTO)
                .toList();
    }

    public StudentDTO getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));
        return toDTO(student);
    }

    public StudentDTO createStudent(StudentDTO dto) {
        if ((dto.getFatherName() == null || dto.getFatherName().isBlank()) &&
            (dto.getMotherName() == null || dto.getMotherName().isBlank()) &&
            (dto.getGuardianName() == null || dto.getGuardianName().isBlank())) {
            throw new BadRequestException("Please provide at least one Father Name, Mother Name, or Guardian Name.");
        }

        if (studentRepository.existsByAdmissionNumber(dto.getAdmissionNumber())) {
            throw new BadRequestException("Admission number already exists: " + dto.getAdmissionNumber());
        }
        if (studentRepository.isDuplicateStudent(dto.getName(), dto.getFatherName(), dto.getMotherName(), dto.getGuardianName(), dto.getAddress(), dto.getDateOfBirth())) {
            throw new BadRequestException("A student with the same Name, Father Name, Address and DOB already exists.");
        }
        Student student = toEntity(dto);
        Student saved = studentRepository.save(student);
        log.info("Created student: {} ({})", saved.getName(), saved.getAdmissionNumber());
        return toDTO(saved);
    }

    public StudentDTO updateStudent(Long id, StudentDTO dto) {
        if ((dto.getFatherName() == null || dto.getFatherName().isBlank()) &&
            (dto.getMotherName() == null || dto.getMotherName().isBlank()) &&
            (dto.getGuardianName() == null || dto.getGuardianName().isBlank())) {
            throw new BadRequestException("Please provide at least one Father Name, Mother Name, or Guardian Name.");
        }

        Student existing = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));

        if (studentRepository.isDuplicateStudentExcludingId(id, dto.getName(), dto.getFatherName(), dto.getMotherName(), dto.getGuardianName(), dto.getAddress(), dto.getDateOfBirth())) {
            throw new BadRequestException("A student with the same Name, Father Name, Address and DOB already exists.");
        }

        existing.setName(dto.getName());
        existing.setDateOfBirth(dto.getDateOfBirth());
        existing.setGender(dto.getGender());
        existing.setParentId(dto.getParentId());
        existing.setClassName(dto.getClassName());
        existing.setSection(dto.getSection());
        existing.setFatherName(dto.getFatherName());
        existing.setMotherName(dto.getMotherName());
        existing.setGuardianName(dto.getGuardianName());
        existing.setContactNumber(dto.getContactNumber());
        existing.setAddress(dto.getAddress());
        existing.setBloodGroup(dto.getBloodGroup());
        existing.setJoiningDate(dto.getJoiningDate());
        existing.setIsActive(dto.getIsActive() != null ? dto.getIsActive() : existing.getIsActive());
        existing.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getPassword() != null && !dto.getPassword().isBlank()) {
            existing.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }

        Student updated = studentRepository.save(existing);
        log.info("Updated student id: {}", id);
        return toDTO(updated);
    }

    public void deleteStudent(Long id) {
        if (!studentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Student", "id", id);
        }
        studentRepository.deleteById(id);
        log.info("Deleted student id: {}", id);
    }

    public StudentDTO updateStudentStatus(Long id, boolean isActive) {
        Student existing = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));
        existing.setIsActive(isActive);
        Student updated = studentRepository.save(existing);
        log.info("Updated student id: {} to isActive={}", id, isActive);
        return toDTO(updated);
    }

    // --- Mapping helpers ---

    private StudentDTO toDTO(Student student) {
        return StudentDTO.builder()
                .id(student.getId())
                .admissionNumber(student.getAdmissionNumber())
                .name(student.getName())
                .dateOfBirth(student.getDateOfBirth())
                .gender(student.getGender())
                .parentId(student.getParentId())
                .className(student.getClassName())
                .section(student.getSection())
                .fatherName(student.getFatherName())
                .motherName(student.getMotherName())
                .guardianName(student.getGuardianName())
                .contactNumber(student.getContactNumber())
                .address(student.getAddress())
                .bloodGroup(student.getBloodGroup())
                .joiningDate(student.getJoiningDate())
                .isActive(student.getIsActive())
                .phoneNumber(student.getPhoneNumber())
                .build();
    }

    private Student toEntity(StudentDTO dto) {
        return Student.builder()
                .admissionNumber(dto.getAdmissionNumber())
                .name(dto.getName())
                .dateOfBirth(dto.getDateOfBirth())
                .gender(dto.getGender())
                .parentId(dto.getParentId())
                .className(dto.getClassName())
                .section(dto.getSection())
                .fatherName(dto.getFatherName())
                .motherName(dto.getMotherName())
                .guardianName(dto.getGuardianName())
                .contactNumber(dto.getContactNumber())
                .address(dto.getAddress())
                .bloodGroup(dto.getBloodGroup())
                .joiningDate(dto.getJoiningDate())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .phoneNumber(dto.getPhoneNumber())
                .passwordHash(dto.getPassword() != null && !dto.getPassword().isBlank() ? passwordEncoder.encode(dto.getPassword()) : null)
                .build();
    }
}

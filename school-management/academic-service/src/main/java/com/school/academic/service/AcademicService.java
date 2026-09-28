package com.school.academic.service;

import com.school.academic.entity.AcademicClass;
import com.school.academic.entity.Exam;
import com.school.academic.entity.Homework;
import com.school.academic.entity.Mark;
import com.school.academic.entity.Subject;
import com.school.academic.repository.AcademicClassRepository;
import com.school.academic.repository.ExamRepository;
import com.school.academic.repository.HomeworkRepository;
import com.school.academic.repository.MarkRepository;
import com.school.academic.repository.SubjectRepository;
import com.school.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;


/**
 * Service layer for academic operations: classes, subjects, exams, marks.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AcademicService {

    private final AcademicClassRepository classRepository;
    private final SubjectRepository subjectRepository;
    private final ExamRepository examRepository;
    private final MarkRepository markRepository;
    private final HomeworkRepository homeworkRepository;

    // ---- AcademicClass ----

    public List<AcademicClass> getAllClasses() {
        return classRepository.findAll();
    }

    public AcademicClass getClassById(Long id) {
        return classRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AcademicClass", "id", id));
    }

    public AcademicClass createClass(AcademicClass academicClass) {
        return classRepository.save(academicClass);
    }

    public AcademicClass updateClass(Long id, AcademicClass updated) {
        AcademicClass existing = getClassById(id);
        existing.setName(updated.getName());
        existing.setSection(updated.getSection());
        existing.setDescription(updated.getDescription());
        return classRepository.save(existing);
    }

    public void deleteClass(Long id) {
        if (!classRepository.existsById(id)) {
            throw new ResourceNotFoundException("AcademicClass", "id", id);
        }
        classRepository.deleteById(id);
    }

    // ---- Subject ----

    public List<Subject> getAllSubjects() {
        return subjectRepository.findAll();
    }

    public Subject getSubjectById(Long id) {
        return subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", "id", id));
    }

    public List<Subject> getSubjectsByClass(Long classId) {
        return subjectRepository.findByClassId(classId);
    }

    @Transactional
    public Subject createSubject(Subject subject) {
        if (subject.getName() == null || subject.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Subject name is required.");
        }
        String trimmedName = subject.getName().trim();
        String trimmedCode = subject.getCode() != null ? subject.getCode().trim() : null;

        if (subjectRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, null)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Subject name '" + trimmedName + "' already exists.");
        }
        if (trimmedCode != null && !trimmedCode.isEmpty() && subjectRepository.existsByCodeIgnoreCaseAndIdNot(trimmedCode, null)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Subject code '" + trimmedCode + "' already exists.");
        }

        subject.setName(trimmedName);
        subject.setCode(trimmedCode);
        return subjectRepository.save(subject);
    }

    @Transactional
    public Subject updateSubject(Long id, Subject updated) {
        Subject existing = getSubjectById(id);
        if (updated.getName() == null || updated.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Subject name is required.");
        }
        String trimmedName = updated.getName().trim();
        String trimmedCode = updated.getCode() != null ? updated.getCode().trim() : null;

        if (subjectRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Subject name '" + trimmedName + "' already exists.");
        }
        if (trimmedCode != null && !trimmedCode.isEmpty() && subjectRepository.existsByCodeIgnoreCaseAndIdNot(trimmedCode, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Subject code '" + trimmedCode + "' already exists.");
        }

        existing.setName(trimmedName);
        existing.setCode(trimmedCode);
        if (updated.getClassId() != null) {
            existing.setClassId(updated.getClassId());
        }
        if (updated.getDescription() != null) {
            existing.setDescription(updated.getDescription());
        }
        Subject saved = subjectRepository.save(existing);
        markRepository.updateSubjectNameForMarks(id, trimmedName);
        return saved;
    }

    @Transactional
    public void deleteSubject(Long id) {
        Subject existing = getSubjectById(id);
        if (markRepository.existsBySubjectIdOrSubjectName(id, existing.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This subject cannot be deleted because marks already exist for this subject.");
        }
        subjectRepository.delete(existing);
    }

    // ---- Exam ----

    public List<Exam> getAllExams() {
        return examRepository.findAll();
    }

    public Exam getExamById(Long id) {
        return examRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Exam", "id", id));
    }

    @Transactional
    public Exam createExam(Exam exam) {
        if (exam.getName() == null || exam.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Exam name is required.");
        }
        String trimmedName = exam.getName().trim();
        if (examRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, null)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Exam name '" + trimmedName + "' already exists.");
        }

        exam.setName(trimmedName);
        if (exam.getTotalMarks() == null || exam.getTotalMarks() <= 0) {
            exam.setTotalMarks(100);
        }
        return examRepository.save(exam);
    }

    @Transactional
    public Exam updateExam(Long id, Exam updated) {
        Exam existing = getExamById(id);
        if (updated.getName() == null || updated.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Exam name is required.");
        }
        String trimmedName = updated.getName().trim();
        if (examRepository.existsByNameIgnoreCaseAndIdNot(trimmedName, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Exam name '" + trimmedName + "' already exists.");
        }

        existing.setName(trimmedName);
        if (updated.getExamDate() != null) {
            existing.setExamDate(updated.getExamDate());
        }
        if (updated.getTotalMarks() != null && updated.getTotalMarks() > 0) {
            existing.setTotalMarks(updated.getTotalMarks());
        }
        if (updated.getClassId() != null) {
            existing.setClassId(updated.getClassId());
        }
        if (updated.getSubjectId() != null) {
            existing.setSubjectId(updated.getSubjectId());
        }

        Exam saved = examRepository.save(existing);
        markRepository.updateExamNameForMarks(id, trimmedName);
        return saved;
    }

    @Transactional
    public void deleteExam(Long id) {
        Exam existing = getExamById(id);
        if (markRepository.existsByExamIdOrExamName(id, existing.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This exam cannot be deleted because marks already exist for this exam.");
        }
        examRepository.delete(existing);
    }


    // ---- Mark ----

    public List<com.school.academic.dto.MarkDTO> searchMarks(String className, String section, String examName, String subjectName) {
        return markRepository.searchMarks(className, section, examName, subjectName).stream()
                .map(this::toMarkDTO)
                .toList();
    }

    public List<com.school.academic.dto.MarkDTO> getMarksByStudent(Long studentId) {
        return markRepository.findByStudentId(studentId).stream()
                .map(this::toMarkDTO)
                .toList();
    }

    public List<com.school.academic.dto.MarkDTO> getMarksByExam(Long examId) {
        return markRepository.findByExamId(examId).stream()
                .map(this::toMarkDTO)
                .toList();
    }

    public com.school.academic.dto.MarkDTO getMarkById(Long id) {
        Mark mark = markRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mark", "id", id));
        return toMarkDTO(mark);
    }

    public com.school.academic.dto.MarkDTO saveOrUpdateMark(com.school.academic.dto.MarkDTO dto) {
        if (dto.getStudentId() == null) {
            throw new IllegalArgumentException("Student ID is required.");
        }
        if (dto.getSubjectName() == null || dto.getSubjectName().trim().isEmpty()) {
            throw new IllegalArgumentException("Subject name is required.");
        }
        if (dto.getExamName() == null || dto.getExamName().trim().isEmpty()) {
            throw new IllegalArgumentException("Exam name is required.");
        }

        double maxMarks = (dto.getMaxMarks() != null && dto.getMaxMarks() > 0) ? dto.getMaxMarks() : 100.0;
        double marksObtained = dto.getMarksObtained() != null ? dto.getMarksObtained() : 0.0;
        if (marksObtained < 0 || marksObtained > maxMarks) {
            throw new IllegalArgumentException("Marks obtained (" + marksObtained + ") must be between 0 and " + maxMarks);
        }

        // Check for existing mark for Student + Subject + Exam (upsert)
        java.util.Optional<Mark> existingOpt = dto.getId() != null ?
                markRepository.findById(dto.getId()) :
                markRepository.findFirstByStudentIdAndSubjectNameIgnoreCaseAndExamNameIgnoreCase(
                        dto.getStudentId(), dto.getSubjectName(), dto.getExamName());

        Long resolvedExamId = dto.getExamId();
        if (resolvedExamId == null && dto.getExamName() != null) {
            resolvedExamId = examRepository.findAll().stream()
                    .filter(e -> e.getName() != null && e.getName().equalsIgnoreCase(dto.getExamName().trim()))
                    .map(Exam::getId)
                    .findFirst()
                    .orElse(null);
        }

        Long resolvedSubjectId = dto.getSubjectId();
        if (resolvedSubjectId == null && dto.getSubjectName() != null) {
            resolvedSubjectId = subjectRepository.findAll().stream()
                    .filter(s -> s.getName() != null && s.getName().equalsIgnoreCase(dto.getSubjectName().trim()))
                    .map(Subject::getId)
                    .findFirst()
                    .orElse(null);
        }

        Mark mark;
        if (existingOpt.isPresent()) {
            mark = existingOpt.get();
            mark.setMarksObtained(marksObtained);
            mark.setMaxMarks(maxMarks);
            mark.setGrade(Mark.calculateGrade(marksObtained, maxMarks));
            if (dto.getRemarks() != null) mark.setRemarks(dto.getRemarks());
            if (dto.getClassName() != null) mark.setClassName(dto.getClassName());
            if (dto.getSection() != null) mark.setSection(dto.getSection());
            if (dto.getStudentName() != null) mark.setStudentName(dto.getStudentName());
            if (dto.getAdmissionNumber() != null) mark.setAdmissionNumber(dto.getAdmissionNumber());
            if (mark.getExamId() == null) mark.setExamId(resolvedExamId);
            if (mark.getSubjectId() == null) mark.setSubjectId(resolvedSubjectId);
            mark.setUpdatedAt(java.time.LocalDateTime.now());
        } else {
            mark = Mark.builder()
                    .studentId(dto.getStudentId())
                    .admissionNumber(dto.getAdmissionNumber())
                    .studentName(dto.getStudentName())
                    .className(dto.getClassName())
                    .section(dto.getSection())
                    .examId(resolvedExamId)
                    .examName(dto.getExamName())
                    .subjectId(resolvedSubjectId)
                    .subjectName(dto.getSubjectName())
                    .marksObtained(marksObtained)
                    .maxMarks(maxMarks)
                    .grade(Mark.calculateGrade(marksObtained, maxMarks))
                    .remarks(dto.getRemarks())
                    .createdAt(java.time.LocalDateTime.now())
                    .updatedAt(java.time.LocalDateTime.now())
                    .build();
        }

        Mark saved = markRepository.save(mark);
        return toMarkDTO(saved);
    }

    public List<com.school.academic.dto.MarkDTO> saveBatchMarks(com.school.academic.dto.MarkBatchRequest request) {
        if (request.getMarks() == null || request.getMarks().isEmpty()) {
            return java.util.Collections.emptyList();
        }

        java.util.List<com.school.academic.dto.MarkDTO> results = new java.util.ArrayList<>();
        for (com.school.academic.dto.MarkDTO dto : request.getMarks()) {
            // Apply batch fallbacks
            if (dto.getClassName() == null || dto.getClassName().isEmpty()) {
                dto.setClassName(request.getClassName());
            }
            if (dto.getSection() == null || dto.getSection().isEmpty()) {
                dto.setSection(request.getSection());
            }
            if (dto.getExamName() == null || dto.getExamName().isEmpty()) {
                dto.setExamName(request.getExamName());
            }
            if (dto.getSubjectName() == null || dto.getSubjectName().isEmpty()) {
                dto.setSubjectName(request.getSubjectName());
            }
            if (dto.getMaxMarks() == null || dto.getMaxMarks() <= 0) {
                dto.setMaxMarks(request.getMaxMarks() != null ? request.getMaxMarks() : 100.0);
            }

            if (dto.getMarksObtained() != null) {
                results.add(saveOrUpdateMark(dto));
            }
        }
        return results;
    }

    public com.school.academic.dto.MarkDTO updateMark(Long id, com.school.academic.dto.MarkDTO updated) {
        Mark existing = markRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mark", "id", id));

        double maxMarks = (updated.getMaxMarks() != null && updated.getMaxMarks() > 0) ?
                updated.getMaxMarks() : (existing.getMaxMarks() != null ? existing.getMaxMarks() : 100.0);
        double marksObtained = updated.getMarksObtained() != null ?
                updated.getMarksObtained() : (existing.getMarksObtained() != null ? existing.getMarksObtained() : 0.0);

        if (marksObtained < 0 || marksObtained > maxMarks) {
            throw new IllegalArgumentException("Marks obtained (" + marksObtained + ") must be between 0 and " + maxMarks);
        }

        existing.setMarksObtained(marksObtained);
        existing.setMaxMarks(maxMarks);
        existing.setGrade(Mark.calculateGrade(marksObtained, maxMarks));
        if (updated.getRemarks() != null) existing.setRemarks(updated.getRemarks());
        existing.setUpdatedAt(java.time.LocalDateTime.now());

        Mark saved = markRepository.save(existing);
        return toMarkDTO(saved);
    }

    public void deleteMark(Long id) {
        if (!markRepository.existsById(id)) {
            throw new ResourceNotFoundException("Mark", "id", id);
        }
        markRepository.deleteById(id);
    }

    public com.school.academic.dto.MarkDTO toMarkDTO(Mark mark) {
        return com.school.academic.dto.MarkDTO.builder()
                .id(mark.getId())
                .studentId(mark.getStudentId())
                .admissionNumber(mark.getAdmissionNumber())
                .studentName(mark.getStudentName())
                .className(mark.getClassName())
                .section(mark.getSection())
                .examId(mark.getExamId())
                .examName(mark.getExamName())
                .subjectId(mark.getSubjectId())
                .subjectName(mark.getSubjectName())
                .marksObtained(mark.getMarksObtained())
                .maxMarks(mark.getMaxMarks())
                .grade(mark.getGrade())
                .remarks(mark.getRemarks())
                .createdAt(mark.getCreatedAt())
                .updatedAt(mark.getUpdatedAt())
                .build();
    }

    // ---- Homework ----

    public List<Homework> getAllHomework() {
        return homeworkRepository.findAll();
    }

    public List<Homework> getHomeworkByClass(String className) {
        return homeworkRepository.findByClassName(className);
    }

    public Homework createHomework(Homework homework) {
        return homeworkRepository.save(homework);
    }

    public Homework updateHomework(Long id, Homework updated) {
        Homework existing = homeworkRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Homework", "id", id));
        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setClassName(updated.getClassName());
        existing.setSection(updated.getSection());
        existing.setSubjectId(updated.getSubjectId());
        existing.setDueDate(updated.getDueDate());
        return homeworkRepository.save(existing);
    }

    public void deleteHomework(Long id) {
        if (!homeworkRepository.existsById(id)) {
            throw new ResourceNotFoundException("Homework", "id", id);
        }
        homeworkRepository.deleteById(id);
    }
}

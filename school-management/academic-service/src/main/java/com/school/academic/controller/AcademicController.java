package com.school.academic.controller;

import com.school.academic.dto.BulkUploadResult;
import com.school.academic.dto.MarkBatchRequest;
import com.school.academic.dto.MarkDTO;
import com.school.academic.entity.AcademicClass;
import com.school.academic.entity.Exam;
import com.school.academic.entity.Homework;
import com.school.academic.entity.Subject;
import com.school.academic.security.JwtDecoder;
import com.school.academic.service.AcademicService;
import com.school.academic.service.MarkBulkUploadService;
import com.school.common.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * REST controller for Academic management (classes, subjects, exams, marks, homework).
 */
@RestController
@RequestMapping("/api/academic")
@RequiredArgsConstructor
@Slf4j
public class AcademicController {

    private final AcademicService academicService;
    private final MarkBulkUploadService markBulkUploadService;
    private final JwtDecoder jwtDecoder;

    // ---- Classes ----

    @GetMapping("/classes")
    public ResponseEntity<ApiResponse<List<AcademicClass>>> getAllClasses() {
        return ResponseEntity.ok(ApiResponse.success(academicService.getAllClasses()));
    }

    @GetMapping("/classes/{id}")
    public ResponseEntity<ApiResponse<AcademicClass>> getClassById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success(academicService.getClassById(id)));
    }

    @PostMapping("/classes")
    public ResponseEntity<ApiResponse<AcademicClass>> createClass(
            @RequestBody AcademicClass academicClass,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdminRole(authHeader);
        AcademicClass created = academicService.createClass(academicClass);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Class created", created));
    }

    @PutMapping("/classes/{id}")
    public ResponseEntity<ApiResponse<AcademicClass>> updateClass(
            @PathVariable("id") Long id,
            @RequestBody AcademicClass academicClass,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdminRole(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Class updated", academicService.updateClass(id, academicClass)));
    }

    @DeleteMapping("/classes/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteClass(
            @PathVariable("id") Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdminRole(authHeader);
        academicService.deleteClass(id);
        return ResponseEntity.ok(ApiResponse.success("Class deleted", null));
    }

    // ---- Subjects ----

    @GetMapping("/subjects")
    public ResponseEntity<ApiResponse<List<Subject>>> getAllSubjects() {
        return ResponseEntity.ok(ApiResponse.success(academicService.getAllSubjects()));
    }

    @GetMapping("/subjects/{id}")
    public ResponseEntity<ApiResponse<Subject>> getSubjectById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success(academicService.getSubjectById(id)));
    }

    @GetMapping("/subjects/class/{classId}")
    public ResponseEntity<ApiResponse<List<Subject>>> getSubjectsByClass(@PathVariable("classId") Long classId) {
        return ResponseEntity.ok(ApiResponse.success(academicService.getSubjectsByClass(classId)));
    }

    @PostMapping("/subjects")
    public ResponseEntity<ApiResponse<Subject>> createSubject(
            @RequestBody Subject subject,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdminRole(authHeader);
        Subject created = academicService.createSubject(subject);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Subject created", created));
    }

    @PutMapping("/subjects/{id}")
    public ResponseEntity<ApiResponse<Subject>> updateSubject(
            @PathVariable("id") Long id,
            @RequestBody Subject subject,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdminRole(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Subject updated", academicService.updateSubject(id, subject)));
    }

    @DeleteMapping("/subjects/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSubject(
            @PathVariable("id") Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdminRole(authHeader);
        academicService.deleteSubject(id);
        return ResponseEntity.ok(ApiResponse.success("Subject deleted", null));
    }

    // ---- Exams ----

    @GetMapping("/exams")
    public ResponseEntity<ApiResponse<List<Exam>>> getAllExams() {
        return ResponseEntity.ok(ApiResponse.success(academicService.getAllExams()));
    }

    @GetMapping("/exams/{id}")
    public ResponseEntity<ApiResponse<Exam>> getExamById(@PathVariable("id") Long id) {
        return ResponseEntity.ok(ApiResponse.success(academicService.getExamById(id)));
    }

    @PostMapping("/exams")
    public ResponseEntity<ApiResponse<Exam>> createExam(
            @RequestBody Exam exam,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdminRole(authHeader);
        Exam created = academicService.createExam(exam);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Exam created", created));
    }

    @PutMapping("/exams/{id}")
    public ResponseEntity<ApiResponse<Exam>> updateExam(
            @PathVariable("id") Long id,
            @RequestBody Exam exam,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdminRole(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Exam updated", academicService.updateExam(id, exam)));
    }

    @DeleteMapping("/exams/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteExam(
            @PathVariable("id") Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdminRole(authHeader);
        academicService.deleteExam(id);
        return ResponseEntity.ok(ApiResponse.success("Exam deleted", null));
    }


    // ---- Marks ----

    @GetMapping("/marks")
    public ResponseEntity<ApiResponse<List<MarkDTO>>> getMarks(
            @RequestParam(value = "className", required = false) String className,
            @RequestParam(value = "section", required = false) String section,
            @RequestParam(value = "examName", required = false) String examName,
            @RequestParam(value = "subjectName", required = false) String subjectName,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyStaffRole(authHeader);
        List<MarkDTO> marks = academicService.searchMarks(className, section, examName, subjectName);
        return ResponseEntity.ok(ApiResponse.success(marks));
    }

    @GetMapping("/marks/{id}")
    public ResponseEntity<ApiResponse<MarkDTO>> getMarkById(
            @PathVariable("id") Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyStaffRole(authHeader);
        return ResponseEntity.ok(ApiResponse.success(academicService.getMarkById(id)));
    }

    @GetMapping("/marks/student/{studentId}")
    public ResponseEntity<ApiResponse<List<MarkDTO>>> getMarksByStudent(
            @PathVariable("studentId") Long studentId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        // Enforce parent-child isolation if called by a PARENT role
        if (authHeader != null) {
            String token = jwtDecoder.extractRaw(authHeader);
            if (token != null && jwtDecoder.isValidToken(token)) {
                String role = normalizeRole(jwtDecoder.getRole(token));
                if ("PARENT".equals(role)) {
                    Long tokenStudentId = jwtDecoder.getStudentId(token);
                    if (tokenStudentId != null && !tokenStudentId.equals(studentId)) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(ApiResponse.error("You are only authorized to view marks for your linked child"));
                    }
                }
            }
        }
        return ResponseEntity.ok(ApiResponse.success(academicService.getMarksByStudent(studentId)));
    }

    @GetMapping("/marks/exam/{examId}")
    public ResponseEntity<ApiResponse<List<MarkDTO>>> getMarksByExam(@PathVariable("examId") Long examId) {
        return ResponseEntity.ok(ApiResponse.success(academicService.getMarksByExam(examId)));
    }

    @PostMapping("/marks")
    public ResponseEntity<ApiResponse<MarkDTO>> createMark(
            @RequestBody MarkDTO markDTO,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyStaffRole(authHeader);
        MarkDTO created = academicService.saveOrUpdateMark(markDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Mark recorded", created));
    }

    @PutMapping("/marks/{id}")
    public ResponseEntity<ApiResponse<MarkDTO>> updateMark(
            @PathVariable("id") Long id,
            @RequestBody MarkDTO markDTO,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyStaffRole(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Mark updated", academicService.updateMark(id, markDTO)));
    }

    @DeleteMapping("/marks/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMark(
            @PathVariable("id") Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyAdminRole(authHeader);
        academicService.deleteMark(id);
        return ResponseEntity.ok(ApiResponse.success("Mark deleted", null));
    }

    @PostMapping("/marks/batch")
    public ResponseEntity<ApiResponse<List<MarkDTO>>> saveBatchMarks(
            @RequestBody MarkBatchRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyStaffRole(authHeader);
        List<MarkDTO> saved = academicService.saveBatchMarks(request);
        return ResponseEntity.ok(ApiResponse.success("Marks saved successfully", saved));
    }

    @PostMapping("/marks/bulk-upload")
    public ResponseEntity<ApiResponse<BulkUploadResult>> bulkUploadMarks(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "mode", defaultValue = "WHOLE_SCHOOL") String mode,
            @RequestParam(value = "className", required = false) String className,
            @RequestParam(value = "section", required = false) String section,
            @RequestParam(value = "examName", required = false) String examName,
            @RequestParam(value = "subjectName", required = false) String subjectName,
            @RequestHeader(value = "Authorization", required = false) String authHeader) throws java.io.IOException {
        verifyStaffRole(authHeader);
        BulkUploadResult result = markBulkUploadService.processBulkUpload(file, mode, className, section, subjectName, examName);
        return ResponseEntity.ok(ApiResponse.success("Bulk marks processed", result));
    }

    @GetMapping("/marks/bulk-template")
    public ResponseEntity<byte[]> downloadTemplate(
            @RequestParam(value = "mode", defaultValue = "WHOLE_SCHOOL") String mode) throws java.io.IOException {
        byte[] bytes = markBulkUploadService.generateTemplate(mode);
        String filename = "WHOLE_SCHOOL".equalsIgnoreCase(mode) ?
                "marks_whole_school_template.xlsx" : "marks_classwise_template.xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(bytes);
    }

    // ---- Homework ----

    @GetMapping("/homework")
    public ResponseEntity<ApiResponse<List<Homework>>> getAllHomework() {
        return ResponseEntity.ok(ApiResponse.success(academicService.getAllHomework()));
    }

    @GetMapping("/homework/class/{className}")
    public ResponseEntity<ApiResponse<List<Homework>>> getHomeworkByClass(@PathVariable("className") String className) {
        return ResponseEntity.ok(ApiResponse.success(academicService.getHomeworkByClass(className)));
    }

    @PostMapping("/homework")
    public ResponseEntity<ApiResponse<Homework>> createHomework(
            @RequestBody Homework homework,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyStaffRole(authHeader);
        Homework created = academicService.createHomework(homework);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Homework created", created));
    }

    @PutMapping("/homework/{id}")
    public ResponseEntity<ApiResponse<Homework>> updateHomework(
            @PathVariable("id") Long id,
            @RequestBody Homework homework,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyStaffRole(authHeader);
        return ResponseEntity.ok(ApiResponse.success("Homework updated", academicService.updateHomework(id, homework)));
    }

    @DeleteMapping("/homework/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteHomework(
            @PathVariable("id") Long id,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        verifyStaffRole(authHeader);
        academicService.deleteHomework(id);
        return ResponseEntity.ok(ApiResponse.success("Homework deleted", null));
    }

    // ---- Role verification helpers ----

    private void verifyStaffRole(String authHeader) {
        if (authHeader == null) return;
        String token = jwtDecoder.extractRaw(authHeader);
        if (token != null && jwtDecoder.isValidToken(token)) {
            String role = normalizeRole(jwtDecoder.getRole(token));
            if (!"ADMIN".equals(role) && !"TEACHER".equals(role)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Only Admin and Teachers are authorized to access Marks management.");
            }
        }
    }

    private void verifyAdminRole(String authHeader) {
        if (authHeader == null) return;
        String token = jwtDecoder.extractRaw(authHeader);
        if (token != null && jwtDecoder.isValidToken(token)) {
            String role = normalizeRole(jwtDecoder.getRole(token));
            if (!"ADMIN".equals(role)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Only Admin is authorized to perform this operation.");
            }
        }
    }

    private String normalizeRole(String role) {
        if (role == null) return "";
        return role.toUpperCase().replace("ROLE_", "").trim();
    }
}

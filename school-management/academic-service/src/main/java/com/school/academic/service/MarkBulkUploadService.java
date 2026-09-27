package com.school.academic.service;

import com.school.academic.dto.BulkUploadError;
import com.school.academic.dto.BulkUploadResult;
import com.school.academic.dto.StudentInfoDTO;
import com.school.academic.entity.Exam;
import com.school.academic.entity.Mark;
import com.school.academic.entity.Subject;
import com.school.academic.repository.ExamRepository;
import com.school.academic.repository.MarkRepository;
import com.school.academic.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class MarkBulkUploadService {

    private final MarkRepository markRepository;
    private final SubjectRepository subjectRepository;
    private final ExamRepository examRepository;
    private final StudentServiceClient studentServiceClient;

    /**
     * Generates downloadable Excel template (.xlsx) for bulk marks upload.
     */
    public byte[] generateTemplate(String type) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Marks Upload");

            // Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            boolean isClassWise = "CLASS_WISE".equalsIgnoreCase(type);

            // Columns
            String[] headers = isClassWise ?
                    new String[]{"Admission No", "Student Name", "Class", "Section", "Marks"} :
                    new String[]{"Admission No", "Student Name", "Class", "Section", "Subject", "Exam", "Marks", "Maximum Marks"};

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Sample Rows
            String[][] sampleData = isClassWise ?
                    new String[][]{
                            {"10", "Abder shaheen", "10", "A", "85"},
                            {"RN-6089", "shahul hameed", "10", "B", "91"},
                            {"101", "azeez ahamed", "10", "C", "78"}
                    } :
                    new String[][]{
                            {"10", "Abder shaheen", "Class 10", "A", "Mathematics", "Quarterly", "85", "100"},
                            {"RN-6089", "shahul hameed", "Class 10", "B", "Science", "Quarterly", "78", "100"},
                            {"101", "azeez ahamed", "Class 10", "C", "English", "Quarterly", "92", "100"},
                            {"111", "kumar A", "Class 11", "A", "Physics", "Quarterly", "88", "100"},
                            {"812020205002", "manoj kumar", "Class 9", "A", "Social Science", "Half Yearly", "75", "100"},
                            {"10101010", "Aiyan Raj", "Class 12", "B", "Mathematics", "Annual Exam", "95", "100"}
                    };

            for (int r = 0; r < sampleData.length; r++) {
                Row row = sheet.createRow(r + 1);
                for (int c = 0; c < sampleData[r].length; c++) {
                    row.createCell(c).setCellValue(sampleData[r][c]);
                }
            }

            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Processes bulk marks upload from Excel file.
     * Supports both whole-school mixed-class and class-wise modes.
     */
    @Transactional
    public BulkUploadResult processBulkUpload(
            MultipartFile file,
            String mode,
            String fallbackClass,
            String fallbackSection,
            String fallbackSubject,
            String fallbackExam) throws IOException {

        if (file.isEmpty()) {
            throw new IllegalArgumentException("The uploaded file is empty.");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".xlsx") && !filename.endsWith(".xls"))) {
            throw new IllegalArgumentException("Invalid file format. Please upload an Excel file (.xlsx or .xls).");
        }

        // 1. Fetch all students from Student Service
        List<StudentInfoDTO> allStudents = studentServiceClient.getAllStudents();
        Map<String, StudentInfoDTO> studentByAdmission = new HashMap<>();
        Map<String, StudentInfoDTO> studentById = new HashMap<>();
        for (StudentInfoDTO s : allStudents) {
            if (s.getAdmissionNumber() != null) {
                studentByAdmission.put(s.getAdmissionNumber().trim().toLowerCase(), s);
            }
            if (s.getId() != null) {
                studentById.put(s.getId().toString(), s);
            }
        }

        // 2. Fetch master subjects
        List<Subject> allSubjects = subjectRepository.findAll();
        Map<String, Subject> subjectMap = new HashMap<>();
        for (Subject sub : allSubjects) {
            if (sub.getName() != null) {
                subjectMap.put(sub.getName().trim().toLowerCase(), sub);
            }
        }

        // 3. Fetch master exams
        List<Exam> allExams = examRepository.findAll();
        Map<String, Exam> examMap = new HashMap<>();
        for (Exam ex : allExams) {
            if (ex.getName() != null) {
                examMap.put(ex.getName().trim().toLowerCase(), ex);
            }
        }

        // 4. Read Excel workbook
        int totalRows = 0;
        int successful = 0;
        int updated = 0;
        int failed = 0;
        List<BulkUploadError> errors = new ArrayList<>();

        try (InputStream is = file.getInputStream(); Workbook workbook = WorkbookFactory.create(is)) {
            Sheet sheet = workbook.getSheetAt(0);
            DataFormatter formatter = new DataFormatter();

            // Detect column positions dynamically from header row (row 0)
            int colAdmission = -1;
            int colName = -1;
            int colClass = -1;
            int colSection = -1;
            int colSubject = -1;
            int colExam = -1;
            int colMarks = -1;
            int colMaxMarks = -1;

            Row headerRow = sheet.getRow(0);
            if (headerRow != null) {
                int lastCell = headerRow.getLastCellNum();
                for (int c = 0; c < lastCell; c++) {
                    String h = getCellString(headerRow, c, formatter).toLowerCase().replaceAll("[^a-z0-9]", "");
                    if (h.contains("admission") || h.contains("admno") || h.contains("roll") || h.contains("studentid")) {
                        colAdmission = c;
                    } else if (h.contains("name") || h.contains("student")) {
                        colName = c;
                    } else if (h.contains("class")) {
                        colClass = c;
                    } else if (h.contains("section") || h.contains("sec")) {
                        colSection = c;
                    } else if (h.contains("subject") || h.contains("sub")) {
                        colSubject = c;
                    } else if (h.contains("exam")) {
                        colExam = c;
                    } else if (h.contains("max") || h.contains("total")) {
                        colMaxMarks = c;
                    } else if (h.contains("mark") || h.contains("score")) {
                        colMarks = c;
                    }
                }
            }

            // Defaults if header names not detected:
            if ("CLASS_WISE".equalsIgnoreCase(mode)) {
                if (colAdmission == -1) colAdmission = 0;
                if (colName == -1) colName = 1;
                if (colClass == -1) colClass = 2;
                if (colSection == -1) colSection = 3;
                if (colMarks == -1) colMarks = 4;
            } else {
                if (colAdmission == -1) colAdmission = 0;
                if (colName == -1) colName = 1;
                if (colClass == -1) colClass = 2;
                if (colSection == -1) colSection = 3;
                if (colSubject == -1) colSubject = 4;
                if (colExam == -1) colExam = 5;
                if (colMarks == -1) colMarks = 6;
                if (colMaxMarks == -1) colMaxMarks = 7;
            }

            int lastRow = sheet.getLastRowNum();
            for (int r = 1; r <= lastRow; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowEmpty(row, formatter)) {
                    continue;
                }

                totalRows++;
                int rowNumber = r + 1; // 1-based for user readability

                String rawAdmission = colAdmission >= 0 ? getCellString(row, colAdmission, formatter) : null;
                String rawName = colName >= 0 ? getCellString(row, colName, formatter) : null;
                String rawClass = colClass >= 0 ? getCellString(row, colClass, formatter) : null;
                String rawSection = colSection >= 0 ? getCellString(row, colSection, formatter) : null;
                String rawSubject = colSubject >= 0 ? getCellString(row, colSubject, formatter) : null;
                String rawExam = colExam >= 0 ? getCellString(row, colExam, formatter) : null;
                String rawMarks = colMarks >= 0 ? getCellString(row, colMarks, formatter) : null;
                String rawMaxMarks = colMaxMarks >= 0 ? getCellString(row, colMaxMarks, formatter) : null;

                // Fallbacks for Class-Wise mode if columns are left empty in row
                if ((rawClass == null || rawClass.isEmpty()) && fallbackClass != null) {
                    rawClass = fallbackClass;
                }
                if ((rawSection == null || rawSection.isEmpty()) && fallbackSection != null) {
                    rawSection = fallbackSection;
                }
                if ((rawSubject == null || rawSubject.isEmpty()) && fallbackSubject != null) {
                    rawSubject = fallbackSubject;
                }
                if ((rawExam == null || rawExam.isEmpty()) && fallbackExam != null) {
                    rawExam = fallbackExam;
                }

                // --- Validation 1: Admission Number ---
                if (rawAdmission == null || rawAdmission.trim().isEmpty()) {
                    failed++;
                    errors.add(new BulkUploadError(rowNumber, "", rawName, rawClass, rawSection, rawSubject, rawExam,
                            "Missing Admission Number", "Admission Number is required."));
                    continue;
                }

                String cleanAdmission = rawAdmission.trim();
                StudentInfoDTO student = studentByAdmission.get(cleanAdmission.toLowerCase());
                if (student == null) {
                    student = studentById.get(cleanAdmission);
                }

                if (student == null) {
                    failed++;
                    errors.add(new BulkUploadError(rowNumber, cleanAdmission, rawName, rawClass, rawSection, rawSubject, rawExam,
                            "Student Not Found", "No registered student found with Admission No / ID: " + cleanAdmission));
                    continue;
                }

                // --- Validation 2: Class & Section Match ---
                String actualClassNorm = normalizeClass(student.getClassName());
                String actualSectionNorm = normalizeSection(student.getSection());

                String excelClassNorm = normalizeClass(rawClass);
                String excelSectionNorm = normalizeSection(rawSection);

                boolean classMismatch = !actualClassNorm.equalsIgnoreCase(excelClassNorm);
                boolean sectionMismatch = !excelSectionNorm.isEmpty() &&
                        !actualSectionNorm.isEmpty() &&
                        !actualSectionNorm.equalsIgnoreCase(excelSectionNorm);

                if (classMismatch || sectionMismatch) {
                    failed++;
                    String issue = classMismatch && sectionMismatch ? "Invalid Class and Section"
                            : classMismatch ? "Invalid Class" : "Invalid Section";
                    String details = "Student belongs to " + student.getClassName() +
                            (student.getSection() != null ? "-" + student.getSection() : "") +
                            ", but Excel specifies " + (rawClass != null ? rawClass : "N/A") +
                            (rawSection != null && !rawSection.isEmpty() ? "-" + rawSection : "") + ".";
                    errors.add(new BulkUploadError(rowNumber, cleanAdmission, student.getName(), rawClass, rawSection,
                            rawSubject, rawExam, issue, details));
                    continue;
                }

                // --- Validation 3: Subject Exists ---
                if (rawSubject == null || rawSubject.trim().isEmpty()) {
                    failed++;
                    errors.add(new BulkUploadError(rowNumber, cleanAdmission, student.getName(), rawClass, rawSection,
                            "", rawExam, "Missing Subject", "Subject name is required."));
                    continue;
                }

                String cleanSubject = rawSubject.trim();
                Subject matchedSubject = findSubjectMatch(cleanSubject, subjectMap);
                if (matchedSubject == null) {
                    failed++;
                    errors.add(new BulkUploadError(rowNumber, cleanAdmission, student.getName(), rawClass, rawSection,
                            cleanSubject, rawExam, "Invalid Subject", "Subject '" + cleanSubject + "' does not exist in master subjects."));
                    continue;
                }

                // --- Validation 4: Exam Exists ---
                if (rawExam == null || rawExam.trim().isEmpty()) {
                    failed++;
                    errors.add(new BulkUploadError(rowNumber, cleanAdmission, student.getName(), rawClass, rawSection,
                            matchedSubject.getName(), "", "Missing Exam", "Exam name is required."));
                    continue;
                }

                String cleanExam = rawExam.trim();
                Exam matchedExam = findExamMatch(cleanExam, examMap);
                if (matchedExam == null) {
                    failed++;
                    errors.add(new BulkUploadError(rowNumber, cleanAdmission, student.getName(), rawClass, rawSection,
                            matchedSubject.getName(), cleanExam, "Invalid Exam", "Exam '" + cleanExam + "' does not exist in master exams."));
                    continue;
                }

                // --- Validation 5: Marks Range ---
                if (rawMarks == null || rawMarks.trim().isEmpty()) {
                    failed++;
                    errors.add(new BulkUploadError(rowNumber, cleanAdmission, student.getName(), rawClass, rawSection,
                            matchedSubject.getName(), matchedExam.getName(), "Missing Marks", "Marks value is required."));
                    continue;
                }

                double marksVal;
                try {
                    marksVal = Double.parseDouble(rawMarks.trim());
                } catch (NumberFormatException e) {
                    failed++;
                    errors.add(new BulkUploadError(rowNumber, cleanAdmission, student.getName(), rawClass, rawSection,
                            matchedSubject.getName(), matchedExam.getName(), "Invalid Number Format", "Marks '" + rawMarks + "' is not a valid number."));
                    continue;
                }

                double maxMarksVal = 100.0;
                if (rawMaxMarks != null && !rawMaxMarks.trim().isEmpty()) {
                    try {
                        maxMarksVal = Double.parseDouble(rawMaxMarks.trim());
                    } catch (NumberFormatException ignored) {
                    }
                } else if (matchedExam.getTotalMarks() != null && matchedExam.getTotalMarks() > 0) {
                    maxMarksVal = matchedExam.getTotalMarks();
                }

                if (marksVal < 0 || marksVal > maxMarksVal) {
                    failed++;
                    errors.add(new BulkUploadError(rowNumber, cleanAdmission, student.getName(), rawClass, rawSection,
                            matchedSubject.getName(), matchedExam.getName(), "Invalid Marks",
                            "Marks " + marksVal + " must be between 0 and Maximum Marks (" + maxMarksVal + ")."));
                    continue;
                }

                // --- Validation 6: Duplicate Check / Upsert ---
                Optional<Mark> existingOpt = markRepository
                        .findFirstByStudentIdAndSubjectNameIgnoreCaseAndExamNameIgnoreCase(
                                student.getId(), matchedSubject.getName(), matchedExam.getName());

                if (existingOpt.isPresent()) {
                    Mark existing = existingOpt.get();
                    existing.setMarksObtained(marksVal);
                    existing.setMaxMarks(maxMarksVal);
                    existing.setGrade(Mark.calculateGrade(marksVal, maxMarksVal));
                    existing.setClassName(student.getClassName());
                    existing.setSection(student.getSection());
                    existing.setStudentName(student.getName());
                    existing.setAdmissionNumber(student.getAdmissionNumber());
                    existing.setExamId(matchedExam.getId());
                    existing.setSubjectId(matchedSubject.getId());
                    existing.setUpdatedAt(LocalDateTime.now());
                    markRepository.save(existing);
                    updated++;
                } else {
                    Mark newMark = Mark.builder()
                            .studentId(student.getId())
                            .admissionNumber(student.getAdmissionNumber())
                            .studentName(student.getName())
                            .className(student.getClassName())
                            .section(student.getSection())
                            .examId(matchedExam.getId())
                            .examName(matchedExam.getName())
                            .subjectId(matchedSubject.getId())
                            .subjectName(matchedSubject.getName())
                            .marksObtained(marksVal)
                            .maxMarks(maxMarksVal)
                            .grade(Mark.calculateGrade(marksVal, maxMarksVal))
                            .createdAt(LocalDateTime.now())
                            .updatedAt(LocalDateTime.now())
                            .build();
                    markRepository.save(newMark);
                    successful++;
                }
            }
        }

        String summaryMsg = String.format("Processed %d rows: %d created, %d updated, %d failed.",
                totalRows, successful, updated, failed);
        log.info("Bulk marks upload finished: {}", summaryMsg);

        return BulkUploadResult.builder()
                .totalRows(totalRows)
                .successful(successful)
                .updated(updated)
                .failed(failed)
                .errors(errors)
                .message(summaryMsg)
                .build();
    }

    private Subject findSubjectMatch(String name, Map<String, Subject> subjectMap) {
        String lower = name.trim().toLowerCase();
        if (subjectMap.containsKey(lower)) {
            return subjectMap.get(lower);
        }
        // Substring / alias check
        for (Map.Entry<String, Subject> entry : subjectMap.entrySet()) {
            if (entry.getKey().equalsIgnoreCase(lower) ||
                    entry.getKey().startsWith(lower) ||
                    lower.startsWith(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    private Exam findExamMatch(String name, Map<String, Exam> examMap) {
        String lower = name.trim().toLowerCase();
        if (examMap.containsKey(lower)) {
            return examMap.get(lower);
        }
        // Normalize abbreviations e.g. "qtr" -> "quarterly", "mid term 1" -> "1st mid term"
        for (Map.Entry<String, Exam> entry : examMap.entrySet()) {
            if (entry.getKey().equalsIgnoreCase(lower)) {
                return entry.getValue();
            }
        }
        return null;
    }

    public static String normalizeClass(String cls) {
        if (cls == null) return "";
        String s = cls.trim();
        s = s.replaceAll("(?i)^(class|grade)\\s*", "").trim();
        return "Class " + s;
    }

    public static String normalizeSection(String sec) {
        if (sec == null) return "";
        return sec.trim().toUpperCase();
    }

    private boolean isRowEmpty(Row row, DataFormatter formatter) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && !formatter.formatCellValue(cell).trim().isEmpty()) {
                return false;
            }
        }
        return true;
    }

    private String getCellString(Row row, int index, DataFormatter formatter) {
        Cell cell = row.getCell(index);
        if (cell == null) return "";
        return formatter.formatCellValue(cell).trim();
    }
}

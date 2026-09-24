package com.school.fee.service;

import com.school.common.enums.FeeStatus;
import com.school.fee.dto.BulkUploadBillingError;
import com.school.fee.dto.BulkUploadBillingResult;
import com.school.fee.dto.StudentInfoDTO;
import com.school.fee.entity.Fee;
import com.school.fee.repository.FeeRepository;
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
import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class FeeExcelService {

    private final StudentServiceClient studentServiceClient;
    private final FeeRepository feeRepository;

    public static final String[] TEMPLATE_HEADERS = {
            "S.No",
            "Student Name",
            "Class",
            "Term Fees - 1",
            "Term Fees - 2",
            "Term Fees - 3",
            "Bus Fees",
            "Exam Fees",
            "Outstanding Amount",
            "Paid Amount",
            "Total Amount"
    };

    /**
     * Generate an Excel template specifically for the given class, pre-filled with active students.
     */
    public byte[] generateTemplate(String className) throws IOException {
        List<StudentInfoDTO> activeStudents = studentServiceClient.getActiveStudentsByClass(className);

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet(className + " Billing Template");
            sheet.createFreezePane(0, 1);

            // Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            // Data Style
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            dataStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // Numeric/Currency Data Style
            CellStyle numberStyle = workbook.createCellStyle();
            numberStyle.cloneStyleFrom(dataStyle);
            numberStyle.setAlignment(HorizontalAlignment.RIGHT);

            // Center Data Style
            CellStyle centerStyle = workbook.createCellStyle();
            centerStyle.cloneStyleFrom(dataStyle);
            centerStyle.setAlignment(HorizontalAlignment.CENTER);

            // Create Header Row
            Row headerRow = sheet.createRow(0);
            headerRow.setHeightInPoints(24);

            for (int i = 0; i < TEMPLATE_HEADERS.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(TEMPLATE_HEADERS[i]);
                cell.setCellStyle(headerStyle);
            }

            // Hidden Column 11 for internal Student ID / Admission Number mapping
            Cell hiddenHeaderCell = headerRow.createCell(TEMPLATE_HEADERS.length);
            hiddenHeaderCell.setCellValue("Student_Internal_ID");
            hiddenHeaderCell.setCellStyle(headerStyle);

            Cell hiddenAdmHeaderCell = headerRow.createCell(TEMPLATE_HEADERS.length + 1);
            hiddenAdmHeaderCell.setCellValue("Admission_Number");
            hiddenAdmHeaderCell.setCellStyle(headerStyle);

            // Populate active students
            int rowIndex = 1;
            for (StudentInfoDTO student : activeStudents) {
                Row row = sheet.createRow(rowIndex);
                row.setHeightInPoints(20);

                // Col 0: S.No (Display only, 1-based)
                Cell c0 = row.createCell(0);
                c0.setCellValue(rowIndex);
                c0.setCellStyle(centerStyle);

                // Col 1: Student Name
                Cell c1 = row.createCell(1);
                c1.setCellValue(student.getName() != null ? student.getName() : "");
                c1.setCellStyle(dataStyle);

                // Col 2: Class
                Cell c2 = row.createCell(2);
                c2.setCellValue(student.getClassName() != null ? student.getClassName() : className);
                c2.setCellStyle(centerStyle);

                // Cols 3 - 10: Empty financial fields
                for (int col = 3; col < TEMPLATE_HEADERS.length; col++) {
                    Cell c = row.createCell(col);
                    c.setCellValue("");
                    c.setCellStyle(numberStyle);
                }

                // Hidden Cols: Internal Student ID & Admission Number
                Cell cHiddenId = row.createCell(TEMPLATE_HEADERS.length);
                cHiddenId.setCellValue(student.getId() != null ? student.getId().toString() : "");

                Cell cHiddenAdm = row.createCell(TEMPLATE_HEADERS.length + 1);
                cHiddenAdm.setCellValue(student.getAdmissionNumber() != null ? student.getAdmissionNumber() : "");

                rowIndex++;
            }

            // Hide internal tracking columns
            sheet.setColumnHidden(TEMPLATE_HEADERS.length, true);
            sheet.setColumnHidden(TEMPLATE_HEADERS.length + 1, true);

            // Adjust column widths
            for (int i = 0; i < TEMPLATE_HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
                int currentWidth = sheet.getColumnWidth(i);
                sheet.setColumnWidth(i, Math.max(currentWidth + 1024, 3800));
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Process bulk upload of billing records for a specific class.
     * Enforces atomic transaction: if any row fails, zero records are committed.
     */
    @Transactional
    public BulkUploadBillingResult processBulkUpload(String expectedClassName, MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            return BulkUploadBillingResult.builder()
                    .success(false)
                    .errorCount(1)
                    .message("Uploaded file is empty.")
                    .errors(List.of(BulkUploadBillingError.builder()
                            .row(0)
                            .errorType("Empty File")
                            .errorMessage("The uploaded file contains no data.")
                            .build()))
                    .build();
        }

        List<StudentInfoDTO> allStudents = studentServiceClient.getAllStudents();
        Map<Long, StudentInfoDTO> studentByIdMap = new HashMap<>();
        Map<String, StudentInfoDTO> studentByAdmMap = new HashMap<>();
        Map<String, List<StudentInfoDTO>> studentByNameAndClassMap = new HashMap<>();

        for (StudentInfoDTO s : allStudents) {
            if (s.getId() != null) studentByIdMap.put(s.getId(), s);
            if (s.getAdmissionNumber() != null) studentByAdmMap.put(s.getAdmissionNumber().trim().toLowerCase(), s);
            if (s.getName() != null && s.getClassName() != null) {
                String key = s.getName().trim().toLowerCase() + "|" + s.getClassName().trim().toLowerCase();
                studentByNameAndClassMap.computeIfAbsent(key, k -> new ArrayList<>()).add(s);
            }
        }

        List<BulkUploadBillingError> errors = new ArrayList<>();
        List<FeeRecordToSave> recordsToSave = new ArrayList<>();
        Map<Long, Integer> seenStudentIdToRow = new HashMap<>();
        Map<String, Integer> seenStudentNameToRow = new HashMap<>();

        try (InputStream in = file.getInputStream();
             Workbook workbook = WorkbookFactory.create(in)) {

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null || sheet.getLastRowNum() < 1) {
                return BulkUploadBillingResult.builder()
                        .success(false)
                        .errorCount(1)
                        .message("Excel sheet contains no student billing data rows.")
                        .errors(List.of(BulkUploadBillingError.builder()
                                .row(1)
                                .errorType("No Data")
                                .errorMessage("The worksheet has headers but no data rows.")
                                .build()))
                        .build();
            }

            // Validate Header Row
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                return BulkUploadBillingResult.builder()
                        .success(false)
                        .errorCount(1)
                        .message("Missing header row in Excel file.")
                        .build();
            }

            int lastRowNum = sheet.getLastRowNum();
            for (int r = 1; r <= lastRowNum; r++) {
                Row row = sheet.getRow(r);
                if (row == null || isRowCompletelyEmpty(row)) {
                    continue;
                }

                int excelRow = r + 1; // 1-based display row

                String studentName = getCellString(row.getCell(1));
                String rowClassName = getCellString(row.getCell(2));

                if (studentName == null || studentName.isBlank()) {
                    errors.add(BulkUploadBillingError.builder()
                            .row(excelRow)
                            .errorType("Missing Student Name")
                            .errorMessage("Student name cannot be empty.")
                            .build());
                    continue;
                }

                // Check hidden column 11 (Student ID) or 12 (Admission Number)
                String hiddenIdStr = getCellString(row.getCell(TEMPLATE_HEADERS.length));
                String hiddenAdmStr = getCellString(row.getCell(TEMPLATE_HEADERS.length + 1));

                StudentInfoDTO matchedStudent = null;
                if (hiddenIdStr != null && !hiddenIdStr.isBlank()) {
                    try {
                        Long sid = Long.parseLong(hiddenIdStr.trim());
                        matchedStudent = studentByIdMap.get(sid);
                    } catch (NumberFormatException ignored) {}
                }

                if (matchedStudent == null && hiddenAdmStr != null && !hiddenAdmStr.isBlank()) {
                    matchedStudent = studentByAdmMap.get(hiddenAdmStr.trim().toLowerCase());
                }

                if (matchedStudent == null) {
                    // Try to match by Name + Class
                    String searchClass = (rowClassName != null && !rowClassName.isBlank()) ? rowClassName : expectedClassName;
                    String key = studentName.trim().toLowerCase() + "|" + searchClass.trim().toLowerCase();
                    List<StudentInfoDTO> matches = studentByNameAndClassMap.get(key);
                    if (matches != null && !matches.isEmpty()) {
                        matchedStudent = matches.get(0);
                    }
                }

                if (matchedStudent == null) {
                    // Search by Name alone across school to give informative error
                    StudentInfoDTO foundElsewhere = null;
                    for (StudentInfoDTO s : allStudents) {
                        if (s.getName() != null && s.getName().trim().equalsIgnoreCase(studentName.trim())) {
                            foundElsewhere = s;
                            break;
                        }
                    }

                    if (foundElsewhere != null) {
                        // Found but different class
                        errors.add(BulkUploadBillingError.builder()
                                .row(excelRow)
                                .studentName(studentName)
                                .admissionNumber(foundElsewhere.getAdmissionNumber())
                                .className(rowClassName)
                                .errorType("Invalid Class")
                                .errorMessage(String.format("Student \"%s\" belongs to %s, but Excel specifies %s.",
                                        studentName, foundElsewhere.getClassName(), rowClassName != null ? rowClassName : "unknown"))
                                .build());
                        continue;
                    } else {
                        errors.add(BulkUploadBillingError.builder()
                                .row(excelRow)
                                .studentName(studentName)
                                .errorType("Student Not Found")
                                .errorMessage(String.format("Student \"%s\" was not found in the student directory.", studentName))
                                .build());
                        continue;
                    }
                }

                // Student found! Check class mismatch
                if (rowClassName != null && !rowClassName.isBlank() &&
                        !rowClassName.trim().equalsIgnoreCase(matchedStudent.getClassName().trim())) {
                    errors.add(BulkUploadBillingError.builder()
                            .row(excelRow)
                            .studentName(matchedStudent.getName())
                            .admissionNumber(matchedStudent.getAdmissionNumber())
                            .className(rowClassName)
                            .errorType("Invalid Class")
                            .errorMessage(String.format("Student \"%s\" belongs to %s, but Excel specifies %s.",
                                    matchedStudent.getName(), matchedStudent.getClassName(), rowClassName))
                            .build());
                    continue;
                }

                // Check if student belongs to selected class
                if (!expectedClassName.trim().equalsIgnoreCase(matchedStudent.getClassName().trim())) {
                    errors.add(BulkUploadBillingError.builder()
                            .row(excelRow)
                            .studentName(matchedStudent.getName())
                            .admissionNumber(matchedStudent.getAdmissionNumber())
                            .className(matchedStudent.getClassName())
                            .errorType("Invalid Class")
                            .errorMessage(String.format("Student \"%s\" belongs to %s, but upload is for %s.",
                                    matchedStudent.getName(), matchedStudent.getClassName(), expectedClassName))
                            .build());
                    continue;
                }

                // Check inactive status
                if (Boolean.FALSE.equals(matchedStudent.getIsActive())) {
                    errors.add(BulkUploadBillingError.builder()
                            .row(excelRow)
                            .studentName(matchedStudent.getName())
                            .admissionNumber(matchedStudent.getAdmissionNumber())
                            .className(matchedStudent.getClassName())
                            .errorType("Inactive Student")
                            .errorMessage(String.format("Student \"%s\" is inactive and cannot be included in the active billing upload.",
                                    matchedStudent.getName()))
                            .build());
                    continue;
                }

                // Check duplicate within the uploaded Excel file
                if (seenStudentIdToRow.containsKey(matchedStudent.getId())) {
                    int prevRow = seenStudentIdToRow.get(matchedStudent.getId());
                    errors.add(BulkUploadBillingError.builder()
                            .row(excelRow)
                            .studentName(matchedStudent.getName())
                            .admissionNumber(matchedStudent.getAdmissionNumber())
                            .className(matchedStudent.getClassName())
                            .errorType("Duplicate Student")
                            .errorMessage(String.format("Duplicate billing record for student \"%s\". First occurrence: Row %d. Duplicate occurrence: Row %d.",
                                    matchedStudent.getName(), prevRow, excelRow))
                            .duplicateWithRow(prevRow)
                            .build());
                    continue;
                }
                seenStudentIdToRow.put(matchedStudent.getId(), excelRow);
                seenStudentNameToRow.put(matchedStudent.getName().trim().toLowerCase(), excelRow);

                // Parse & Validate numeric fee amounts
                BigDecimal termFees1 = parseAmount(row.getCell(3), "Term Fees - 1", excelRow, matchedStudent, errors);
                BigDecimal termFees2 = parseAmount(row.getCell(4), "Term Fees - 2", excelRow, matchedStudent, errors);
                BigDecimal termFees3 = parseAmount(row.getCell(5), "Term Fees - 3", excelRow, matchedStudent, errors);
                BigDecimal busFees = parseAmount(row.getCell(6), "Bus Fees", excelRow, matchedStudent, errors);
                BigDecimal examFees = parseAmount(row.getCell(7), "Exam Fees", excelRow, matchedStudent, errors);
                BigDecimal paidAmount = parseAmount(row.getCell(9), "Paid Amount", excelRow, matchedStudent, errors);

                if (termFees1 == null || termFees2 == null || termFees3 == null ||
                        busFees == null || examFees == null || paidAmount == null) {
                    // Numeric error already added to errors list
                    continue;
                }

                // Calculate Total & Outstanding
                BigDecimal totalAmount = termFees1.add(termFees2).add(termFees3).add(busFees).add(examFees);

                // Check paid amount doesn't exceed total amount unnecessarily or validate
                BigDecimal outstandingAmount = totalAmount.subtract(paidAmount);
                if (outstandingAmount.compareTo(BigDecimal.ZERO) < 0) {
                    outstandingAmount = BigDecimal.ZERO;
                }

                recordsToSave.add(new FeeRecordToSave(
                        matchedStudent,
                        termFees1,
                        termFees2,
                        termFees3,
                        busFees,
                        examFees,
                        totalAmount,
                        paidAmount,
                        outstandingAmount
                ));
            }
        }

        // If any error exists across any row, fail atomically!
        if (!errors.isEmpty()) {
            String errorExcelBase64 = generateErrorExcelBase64(errors);
            return BulkUploadBillingResult.builder()
                    .success(false)
                    .totalRows(recordsToSave.size() + errors.size())
                    .insertedCount(0)
                    .errorCount(errors.size())
                    .message(String.format("Bulk Upload Failed: %d error(s) found. No billing records added.", errors.size()))
                    .errors(errors)
                    .errorExcelBase64(errorExcelBase64)
                    .build();
        }

        // All rows are 100% valid -> Commit to database atomically
        int savedCount = 0;
        for (FeeRecordToSave rec : recordsToSave) {
            Fee fee = feeRepository.findByStudentIdAndClassName(rec.student.getId(), expectedClassName)
                    .orElse(feeRepository.findFirstByStudentId(rec.student.getId()).orElse(null));

            FeeStatus status;
            if (rec.outstandingAmount.compareTo(BigDecimal.ZERO) == 0 && rec.totalAmount.compareTo(BigDecimal.ZERO) > 0) {
                status = FeeStatus.PAID;
            } else if (rec.paidAmount.compareTo(BigDecimal.ZERO) > 0 && rec.outstandingAmount.compareTo(BigDecimal.ZERO) > 0) {
                status = FeeStatus.PARTIAL;
            } else {
                status = FeeStatus.PENDING;
            }

            if (fee == null) {
                fee = Fee.builder()
                        .studentId(rec.student.getId())
                        .admissionNumber(rec.student.getAdmissionNumber())
                        .studentName(rec.student.getName())
                        .className(expectedClassName)
                        .termFees1(rec.termFees1)
                        .termFees2(rec.termFees2)
                        .termFees3(rec.termFees3)
                        .busFees(rec.busFees)
                        .examFees(rec.examFees)
                        .totalAmount(rec.totalAmount)
                        .paidAmount(rec.paidAmount)
                        .pendingAmount(rec.outstandingAmount)
                        .status(status)
                        .description("Academic Year 2026-2027 Fee")
                        .build();
            } else {
                fee.setAdmissionNumber(rec.student.getAdmissionNumber());
                fee.setStudentName(rec.student.getName());
                fee.setClassName(expectedClassName);
                fee.setTermFees1(rec.termFees1);
                fee.setTermFees2(rec.termFees2);
                fee.setTermFees3(rec.termFees3);
                fee.setBusFees(rec.busFees);
                fee.setExamFees(rec.examFees);
                fee.setTotalAmount(rec.totalAmount);
                fee.setPaidAmount(rec.paidAmount);
                fee.setPendingAmount(rec.outstandingAmount);
                fee.setStatus(status);
            }
            feeRepository.save(fee);
            savedCount++;
        }

        return BulkUploadBillingResult.builder()
                .success(true)
                .totalRows(recordsToSave.size())
                .insertedCount(savedCount)
                .errorCount(0)
                .message(String.format("Bulk Upload Successful: %d billing records committed for %s!", savedCount, expectedClassName))
                .errors(Collections.emptyList())
                .build();
    }

    private BigDecimal parseAmount(Cell cell, String fieldName, int row, StudentInfoDTO student, List<BulkUploadBillingError> errors) {
        if (cell == null || cell.getCellType() == CellType.BLANK) {
            return BigDecimal.ZERO;
        }

        if (cell.getCellType() == CellType.NUMERIC) {
            double val = cell.getNumericCellValue();
            if (val < 0) {
                errors.add(BulkUploadBillingError.builder()
                        .row(row)
                        .studentName(student.getName())
                        .admissionNumber(student.getAdmissionNumber())
                        .className(student.getClassName())
                        .errorType("Negative Amount")
                        .errorMessage(String.format("Field \"%s\" cannot be negative (found: %.2f).", fieldName, val))
                        .build());
                return null;
            }
            return BigDecimal.valueOf(val);
        }

        if (cell.getCellType() == CellType.STRING) {
            String str = cell.getStringCellValue().trim();
            if (str.isEmpty()) return BigDecimal.ZERO;

            // Remove currency symbols and commas if present
            String cleaned = str.replace("₹", "").replace("$", "").replace(",", "").trim();
            try {
                BigDecimal bd = new BigDecimal(cleaned);
                if (bd.compareTo(BigDecimal.ZERO) < 0) {
                    errors.add(BulkUploadBillingError.builder()
                            .row(row)
                            .studentName(student.getName())
                            .admissionNumber(student.getAdmissionNumber())
                            .className(student.getClassName())
                            .errorType("Negative Amount")
                            .errorMessage(String.format("Field \"%s\" cannot be negative (found: %s).", fieldName, str))
                            .build());
                    return null;
                }
                return bd;
            } catch (NumberFormatException e) {
                errors.add(BulkUploadBillingError.builder()
                        .row(row)
                        .studentName(student.getName())
                        .admissionNumber(student.getAdmissionNumber())
                        .className(student.getClassName())
                        .errorType("Invalid Number")
                        .errorMessage(String.format("Invalid numeric amount for \"%s\": \"%s\". Must be a valid non-negative number.", fieldName, str))
                        .build());
                return null;
            }
        }

        errors.add(BulkUploadBillingError.builder()
                .row(row)
                .studentName(student.getName())
                .admissionNumber(student.getAdmissionNumber())
                .className(student.getClassName())
                .errorType("Invalid Format")
                .errorMessage(String.format("Invalid cell format for \"%s\".", fieldName))
                .build());
        return null;
    }

    private String getCellString(Cell cell) {
        if (cell == null) return null;
        if (cell.getCellType() == CellType.STRING) return cell.getStringCellValue().trim();
        if (cell.getCellType() == CellType.NUMERIC) {
            long l = (long) cell.getNumericCellValue();
            if (l == cell.getNumericCellValue()) return String.valueOf(l);
            return String.valueOf(cell.getNumericCellValue());
        }
        return null;
    }

    private boolean isRowCompletelyEmpty(Row row) {
        for (int c = row.getFirstCellNum(); c < row.getLastCellNum(); c++) {
            Cell cell = row.getCell(c);
            if (cell != null && cell.getCellType() != CellType.BLANK) {
                if (cell.getCellType() == CellType.STRING && !cell.getStringCellValue().trim().isEmpty()) {
                    return false;
                }
                if (cell.getCellType() == CellType.NUMERIC) {
                    return false;
                }
            }
        }
        return true;
    }

    private String generateErrorExcelBase64(List<BulkUploadBillingError> errors) {
        try (Workbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            Sheet sheet = wb.createSheet("Bulk Upload Errors");
            sheet.createFreezePane(0, 1);

            CellStyle headerStyle = wb.createCellStyle();
            Font hFont = wb.createFont();
            hFont.setBold(true);
            hFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(hFont);
            headerStyle.setFillForegroundColor(IndexedColors.RED.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);

            Row hRow = sheet.createRow(0);
            String[] errorHeaders = {"Excel Row", "Student Name", "Adm No", "Class", "Error Type", "Error Message"};
            for (int i = 0; i < errorHeaders.length; i++) {
                Cell c = hRow.createCell(i);
                c.setCellValue(errorHeaders[i]);
                c.setCellStyle(headerStyle);
            }

            int r = 1;
            for (BulkUploadBillingError err : errors) {
                Row row = sheet.createRow(r++);
                row.createCell(0).setCellValue(err.getRow() > 0 ? "Row " + err.getRow() : "File Header");
                row.createCell(1).setCellValue(err.getStudentName() != null ? err.getStudentName() : "—");
                row.createCell(2).setCellValue(err.getAdmissionNumber() != null ? err.getAdmissionNumber() : "—");
                row.createCell(3).setCellValue(err.getClassName() != null ? err.getClassName() : "—");
                row.createCell(4).setCellValue(err.getErrorType() != null ? err.getErrorType() : "Error");
                row.createCell(5).setCellValue(err.getErrorMessage() != null ? err.getErrorMessage() : "—");
            }

            for (int i = 0; i < errorHeaders.length; i++) {
                sheet.autoSizeColumn(i);
            }

            wb.write(out);
            return Base64.getEncoder().encodeToString(out.toByteArray());
        } catch (Exception e) {
            log.error("Failed to generate error Excel report: {}", e.getMessage());
            return null;
        }
    }

    private static class FeeRecordToSave {
        final StudentInfoDTO student;
        final BigDecimal termFees1;
        final BigDecimal termFees2;
        final BigDecimal termFees3;
        final BigDecimal busFees;
        final BigDecimal examFees;
        final BigDecimal totalAmount;
        final BigDecimal paidAmount;
        final BigDecimal outstandingAmount;

        FeeRecordToSave(StudentInfoDTO student, BigDecimal termFees1, BigDecimal termFees2, BigDecimal termFees3,
                        BigDecimal busFees, BigDecimal examFees, BigDecimal totalAmount, BigDecimal paidAmount, BigDecimal outstandingAmount) {
            this.student = student;
            this.termFees1 = termFees1;
            this.termFees2 = termFees2;
            this.termFees3 = termFees3;
            this.busFees = busFees;
            this.examFees = examFees;
            this.totalAmount = totalAmount;
            this.paidAmount = paidAmount;
            this.outstandingAmount = outstandingAmount;
        }
    }
}

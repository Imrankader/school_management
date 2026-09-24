package com.school.fee.controller;

import com.school.common.dto.ApiResponse;
import com.school.fee.dto.BulkUploadBillingResult;
import com.school.fee.dto.ClassBillingSummaryDTO;
import com.school.fee.dto.FeeDTO;
import com.school.fee.dto.RecentPaymentDTO;
import com.school.fee.dto.StudentBillingRowDTO;
import com.school.fee.entity.Payment;
import com.school.fee.service.FeeExcelService;
import com.school.fee.service.FeeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

/**
 * REST controller for Fee, Payment, Class Summary, and Bulk Billing management.
 */
@RestController
@RequestMapping("/api/fees")
@RequiredArgsConstructor
@Slf4j
public class FeeController {

    private final FeeService feeService;
    private final FeeExcelService feeExcelService;

    /** GET /api/fees/class-summary — Class-wise billing summary for the main portal */
    @GetMapping("/class-summary")
    public ResponseEntity<ApiResponse<List<ClassBillingSummaryDTO>>> getClassBillingSummaries() {
        List<ClassBillingSummaryDTO> summaries = feeService.getClassBillingSummaries();
        return ResponseEntity.ok(ApiResponse.success(summaries));
    }

    /** GET /api/fees/class/{className} — Detailed student-level billing rows for a class */
    @GetMapping("/class/{className}")
    public ResponseEntity<ApiResponse<List<StudentBillingRowDTO>>> getStudentBillingForClass(
            @PathVariable("className") String className) {
        List<StudentBillingRowDTO> rows = feeService.getStudentBillingForClass(className);
        return ResponseEntity.ok(ApiResponse.success(rows));
    }

    /** GET /api/fees/template/{className} — Download pre-filled Excel template for a class */
    @GetMapping("/template/{className}")
    public ResponseEntity<byte[]> downloadBillingTemplate(@PathVariable("className") String className) {
        try {
            byte[] excelBytes = feeExcelService.generateTemplate(className);
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            String filename = String.format("%s_Billing_Template.xlsx", className.replace(" ", "_"));
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(excelBytes.length);
            return ResponseEntity.ok().headers(headers).body(excelBytes);
        } catch (IOException e) {
            log.error("Failed to generate billing template for {}: {}", className, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /** POST /api/fees/bulk-upload — Atomic bulk upload of billing records for a class */
    @PostMapping("/bulk-upload")
    public ResponseEntity<ApiResponse<BulkUploadBillingResult>> bulkUploadBilling(
            @RequestParam("className") String className,
            @RequestParam("file") MultipartFile file) {
        try {
            BulkUploadBillingResult result = feeExcelService.processBulkUpload(className, file);
            return ResponseEntity.ok(ApiResponse.success(result.getMessage(), result));
        } catch (Exception e) {
            log.error("Bulk billing upload failed for {}: {}", className, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Bulk upload processing failed: " + e.getMessage()));
        }
    }

    /** GET /api/fees/student/{studentId} — Get fees by student */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<ApiResponse<List<FeeDTO>>> getFeesByStudent(@PathVariable("studentId") Long studentId) {
        List<FeeDTO> fees = feeService.getFeesByStudent(studentId);
        return ResponseEntity.ok(ApiResponse.success(fees));
    }

    /** POST /api/fees — Create or update individual student billing record */
    @PostMapping
    public ResponseEntity<ApiResponse<FeeDTO>> createFee(@Valid @RequestBody FeeDTO dto) {
        FeeDTO saved = feeService.createOrUpdateFee(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Billing record saved successfully", saved));
    }

    /** PUT /api/fees/{id} — Update a fee record */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<FeeDTO>> updateFee(@PathVariable("id") Long id,
                                                          @Valid @RequestBody FeeDTO dto) {
        FeeDTO updated = feeService.updateFee(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Fee record updated", updated));
    }

    /** POST /api/fees/{feeId}/payments — Record a payment against a fee */
    @PostMapping("/{feeId}/payments")
    public ResponseEntity<ApiResponse<Payment>> recordPayment(
            @PathVariable("feeId") Long feeId,
            @RequestBody Payment payment) {
        Payment recorded = feeService.recordPayment(feeId, payment);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment recorded", recorded));
    }

    /** GET /api/fees/{feeId}/payments — Get payment history for a fee */
    @GetMapping("/{feeId}/payments")
    public ResponseEntity<ApiResponse<List<Payment>>> getPaymentsByFee(@PathVariable("feeId") Long feeId) {
        List<Payment> payments = feeService.getPaymentsByFee(feeId);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    /** GET /api/fees/student/{studentId}/payments — All payments for a student */
    @GetMapping("/student/{studentId}/payments")
    public ResponseEntity<ApiResponse<List<Payment>>> getPaymentsByStudent(@PathVariable("studentId") Long studentId) {
        List<Payment> payments = feeService.getPaymentsByStudent(studentId);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }

    /** GET /api/fees/payments/recent — Recent payments with student and class information */
    @GetMapping("/payments/recent")
    public ResponseEntity<ApiResponse<List<RecentPaymentDTO>>> getRecentPayments(
            @RequestParam(value = "limit", defaultValue = "10") int limit) {
        List<RecentPaymentDTO> payments = feeService.getRecentPayments(limit);
        return ResponseEntity.ok(ApiResponse.success(payments));
    }
}

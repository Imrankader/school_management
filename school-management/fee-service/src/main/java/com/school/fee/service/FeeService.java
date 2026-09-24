package com.school.fee.service;

import com.school.common.enums.FeeStatus;
import com.school.common.exception.BadRequestException;
import com.school.common.exception.ResourceNotFoundException;
import com.school.fee.dto.ClassBillingSummaryDTO;
import com.school.fee.dto.FeeDTO;
import com.school.fee.dto.StudentBillingRowDTO;
import com.school.fee.dto.StudentInfoDTO;
import com.school.fee.entity.Fee;
import com.school.fee.entity.Payment;
import com.school.fee.repository.FeeRepository;
import com.school.fee.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Business logic for Fee, Payment, Class Summary, and Student Billing.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FeeService {

    private final FeeRepository feeRepository;
    private final PaymentRepository paymentRepository;
    private final StudentServiceClient studentServiceClient;

    /**
     * Get class-wise billing summaries for all configured/existing classes.
     * Calculated dynamically from active students and their fee records.
     */
    public List<ClassBillingSummaryDTO> getClassBillingSummaries() {
        Map<String, List<StudentInfoDTO>> groupedStudents = studentServiceClient.getActiveStudentsGroupedByClass();
        List<String> classes = new ArrayList<>(groupedStudents.keySet());

        if (classes.isEmpty()) {
            classes = studentServiceClient.getDistinctClasses();
        }
        if (classes.isEmpty()) {
            // Fallback: distinct classes from fees table
            classes = feeRepository.findAll().stream()
                    .map(Fee::getClassName)
                    .filter(Objects::nonNull)
                    .distinct()
                    .sorted()
                    .toList();
        }

        // Natural sort order for classes (e.g. LKG, UKG, Class 1, Class 2, ... Class 10, Class 11, Class 12)
        List<String> sortedClasses = new ArrayList<>(classes);
        sortedClasses.sort(this::naturalClassCompare);

        List<ClassBillingSummaryDTO> summaries = new ArrayList<>();
        int sNo = 1;

        for (String className : sortedClasses) {
            List<StudentInfoDTO> activeStudents = groupedStudents.getOrDefault(className, Collections.emptyList());
            if (activeStudents.isEmpty()) {
                activeStudents = studentServiceClient.getActiveStudentsByClass(className);
            }
            long totalStudents = activeStudents.size();

            Set<Long> activeStudentIds = activeStudents.stream()
                    .map(StudentInfoDTO::getId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toSet());

            BigDecimal totalAmount = BigDecimal.ZERO;
            BigDecimal totalPaidAmount = BigDecimal.ZERO;
            BigDecimal totalOutstandingAmount = BigDecimal.ZERO;

            if (!activeStudentIds.isEmpty()) {
                List<Fee> fees = feeRepository.findByStudentIdIn(activeStudentIds);
                for (Fee fee : fees) {
                    if (fee.getTotalAmount() != null) totalAmount = totalAmount.add(fee.getTotalAmount());
                    if (fee.getPaidAmount() != null) totalPaidAmount = totalPaidAmount.add(fee.getPaidAmount());
                    if (fee.getPendingAmount() != null) totalOutstandingAmount = totalOutstandingAmount.add(fee.getPendingAmount());
                }
            }

            summaries.add(ClassBillingSummaryDTO.builder()
                    .sNo(sNo++)
                    .className(className)
                    .totalStudents(totalStudents)
                    .totalAmount(totalAmount)
                    .totalPaidAmount(totalPaidAmount)
                    .totalOutstandingAmount(totalOutstandingAmount)
                    .build());
        }

        return summaries;
    }

    /**
     * Get detailed student-level billing rows for a specific class.
     * Strictly includes only ACTIVE students belonging to this class.
     */
    public List<StudentBillingRowDTO> getStudentBillingForClass(String className) {
        List<StudentInfoDTO> activeStudents = studentServiceClient.getActiveStudentsByClass(className);

        // Fetch existing fees for this class
        Set<Long> studentIds = activeStudents.stream()
                .map(StudentInfoDTO::getId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, Fee> feeMap = new HashMap<>();
        if (!studentIds.isEmpty()) {
            List<Fee> fees = feeRepository.findByStudentIdIn(studentIds);
            for (Fee f : fees) {
                feeMap.put(f.getStudentId(), f);
            }
        }

        List<StudentBillingRowDTO> rows = new ArrayList<>();
        int sNo = 1;

        for (StudentInfoDTO student : activeStudents) {
            Fee fee = feeMap.get(student.getId());

            BigDecimal termFees1 = BigDecimal.ZERO;
            BigDecimal termFees2 = BigDecimal.ZERO;
            BigDecimal termFees3 = BigDecimal.ZERO;
            BigDecimal busFees = BigDecimal.ZERO;
            BigDecimal examFees = BigDecimal.ZERO;
            BigDecimal totalAmount = BigDecimal.ZERO;
            BigDecimal paidAmount = BigDecimal.ZERO;
            BigDecimal outstandingAmount = BigDecimal.ZERO;
            String status = "unbilled";
            Long feeId = null;
            List<Payment> payments = Collections.emptyList();

            if (fee != null) {
                feeId = fee.getId();
                termFees1 = fee.getTermFees1() != null ? fee.getTermFees1() : BigDecimal.ZERO;
                termFees2 = fee.getTermFees2() != null ? fee.getTermFees2() : BigDecimal.ZERO;
                termFees3 = fee.getTermFees3() != null ? fee.getTermFees3() : BigDecimal.ZERO;
                busFees = fee.getBusFees() != null ? fee.getBusFees() : BigDecimal.ZERO;
                examFees = fee.getExamFees() != null ? fee.getExamFees() : BigDecimal.ZERO;
                totalAmount = fee.getTotalAmount() != null ? fee.getTotalAmount() : BigDecimal.ZERO;
                paidAmount = fee.getPaidAmount() != null ? fee.getPaidAmount() : BigDecimal.ZERO;
                outstandingAmount = fee.getPendingAmount() != null ? fee.getPendingAmount() : BigDecimal.ZERO;

                if (outstandingAmount.compareTo(BigDecimal.ZERO) == 0 && totalAmount.compareTo(BigDecimal.ZERO) > 0) {
                    status = "settled";
                } else if (paidAmount.compareTo(BigDecimal.ZERO) > 0 && outstandingAmount.compareTo(BigDecimal.ZERO) > 0) {
                    status = "partially paid";
                } else if (totalAmount.compareTo(BigDecimal.ZERO) > 0) {
                    status = "pending";
                } else {
                    status = "unbilled";
                }

                payments = paymentRepository.findByFeeIdOrderByPaymentDateDesc(fee.getId());
            }

            rows.add(StudentBillingRowDTO.builder()
                    .sNo(sNo++)
                    .studentId(student.getId())
                    .admissionNumber(student.getAdmissionNumber())
                    .studentName(student.getName())
                    .className(student.getClassName() != null ? student.getClassName() : className)
                    .termFees1(termFees1)
                    .termFees2(termFees2)
                    .termFees3(termFees3)
                    .busFees(busFees)
                    .examFees(examFees)
                    .outstandingAmount(outstandingAmount)
                    .paidAmount(paidAmount)
                    .totalAmount(totalAmount)
                    .status(status)
                    .feeId(feeId)
                    .payments(payments)
                    .build());
        }

        return rows;
    }

    /**
     * Create or update fee record for an individual active student.
     * Enforces consistency: Total = Terms + Bus + Exam, Outstanding = Total - Paid.
     */
    @Transactional
    public FeeDTO createOrUpdateFee(FeeDTO dto) {
        if (dto.getStudentId() == null) {
            throw new BadRequestException("Student ID is required.");
        }

        // Calculate total amount from breakdown
        BigDecimal t1 = dto.getTermFees1() != null ? dto.getTermFees1() : BigDecimal.ZERO;
        BigDecimal t2 = dto.getTermFees2() != null ? dto.getTermFees2() : BigDecimal.ZERO;
        BigDecimal t3 = dto.getTermFees3() != null ? dto.getTermFees3() : BigDecimal.ZERO;
        BigDecimal bus = dto.getBusFees() != null ? dto.getBusFees() : BigDecimal.ZERO;
        BigDecimal exam = dto.getExamFees() != null ? dto.getExamFees() : BigDecimal.ZERO;
        BigDecimal paid = dto.getPaidAmount() != null ? dto.getPaidAmount() : BigDecimal.ZERO;

        BigDecimal total = t1.add(t2).add(t3).add(bus).add(exam);
        if (dto.getTotalAmount() != null && total.compareTo(BigDecimal.ZERO) == 0) {
            total = dto.getTotalAmount();
        }

        BigDecimal pending = total.subtract(paid);
        if (pending.compareTo(BigDecimal.ZERO) < 0) {
            pending = BigDecimal.ZERO;
        }

        FeeStatus status = determineStatus(total, paid);

        Fee fee = feeRepository.findFirstByStudentId(dto.getStudentId()).orElse(null);

        if (fee == null) {
            fee = Fee.builder()
                    .studentId(dto.getStudentId())
                    .admissionNumber(dto.getAdmissionNumber())
                    .studentName(dto.getStudentName())
                    .className(dto.getClassName())
                    .termFees1(t1)
                    .termFees2(t2)
                    .termFees3(t3)
                    .busFees(bus)
                    .examFees(exam)
                    .totalAmount(total)
                    .paidAmount(paid)
                    .pendingAmount(pending)
                    .status(status)
                    .description(dto.getDescription() != null ? dto.getDescription() : "Tuition & Fees")
                    .academicYear(dto.getAcademicYear() != null ? dto.getAcademicYear() : "2026-2027")
                    .dueDate(dto.getDueDate() != null ? dto.getDueDate() : LocalDate.now().plusMonths(1))
                    .build();
        } else {
            if (dto.getAdmissionNumber() != null) fee.setAdmissionNumber(dto.getAdmissionNumber());
            if (dto.getStudentName() != null) fee.setStudentName(dto.getStudentName());
            if (dto.getClassName() != null) fee.setClassName(dto.getClassName());
            fee.setTermFees1(t1);
            fee.setTermFees2(t2);
            fee.setTermFees3(t3);
            fee.setBusFees(bus);
            fee.setExamFees(exam);
            fee.setTotalAmount(total);
            fee.setPaidAmount(paid);
            fee.setPendingAmount(pending);
            fee.setStatus(status);
            if (dto.getDescription() != null) fee.setDescription(dto.getDescription());
            if (dto.getAcademicYear() != null) fee.setAcademicYear(dto.getAcademicYear());
            if (dto.getDueDate() != null) fee.setDueDate(dto.getDueDate());
        }

        Fee saved = feeRepository.save(fee);

        // Record initial payment transaction if paid > 0 and no payment recorded yet
        if (paid.compareTo(BigDecimal.ZERO) > 0) {
            List<Payment> existingPayments = paymentRepository.findByFeeIdOrderByPaymentDateDesc(saved.getId());
            if (existingPayments.isEmpty()) {
                Payment initialPayment = Payment.builder()
                        .feeId(saved.getId())
                        .studentId(saved.getStudentId())
                        .amountPaid(paid)
                        .paymentDate(LocalDate.now())
                        .paymentMethod("ONLINE")
                        .note("Initial payment installment")
                        .build();
                paymentRepository.save(initialPayment);
            }
        }

        log.info("Saved fee record for student {}: total {}, paid {}, pending {}, status {}",
                saved.getStudentId(), total, paid, pending, status);
        return toDTO(saved);
    }

    public List<FeeDTO> getFeesByStudent(Long studentId) {
        return feeRepository.findByStudentId(studentId).stream()
                .map(this::toDTO)
                .toList();
    }

    public FeeDTO updateFee(Long id, FeeDTO dto) {
        Fee existing = feeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Fee", "id", id));

        BigDecimal t1 = dto.getTermFees1() != null ? dto.getTermFees1() : (existing.getTermFees1() != null ? existing.getTermFees1() : BigDecimal.ZERO);
        BigDecimal t2 = dto.getTermFees2() != null ? dto.getTermFees2() : (existing.getTermFees2() != null ? existing.getTermFees2() : BigDecimal.ZERO);
        BigDecimal t3 = dto.getTermFees3() != null ? dto.getTermFees3() : (existing.getTermFees3() != null ? existing.getTermFees3() : BigDecimal.ZERO);
        BigDecimal bus = dto.getBusFees() != null ? dto.getBusFees() : (existing.getBusFees() != null ? existing.getBusFees() : BigDecimal.ZERO);
        BigDecimal exam = dto.getExamFees() != null ? dto.getExamFees() : (existing.getExamFees() != null ? existing.getExamFees() : BigDecimal.ZERO);
        BigDecimal paid = dto.getPaidAmount() != null ? dto.getPaidAmount() : existing.getPaidAmount();

        BigDecimal total = t1.add(t2).add(t3).add(bus).add(exam);
        if (dto.getTotalAmount() != null && total.compareTo(BigDecimal.ZERO) == 0) {
            total = dto.getTotalAmount();
        }

        BigDecimal pending = total.subtract(paid);
        if (pending.compareTo(BigDecimal.ZERO) < 0) pending = BigDecimal.ZERO;

        FeeStatus status = determineStatus(total, paid);

        existing.setTermFees1(t1);
        existing.setTermFees2(t2);
        existing.setTermFees3(t3);
        existing.setBusFees(bus);
        existing.setExamFees(exam);
        existing.setTotalAmount(total);
        existing.setPaidAmount(paid);
        existing.setPendingAmount(pending);
        existing.setStatus(status);
        if (dto.getDescription() != null) existing.setDescription(dto.getDescription());

        Fee updated = feeRepository.save(existing);
        log.info("Updated fee {} for student {}: {}", id, dto.getStudentId(), status);
        return toDTO(updated);
    }

    /**
     * Record a payment against a fee.
     * Automatically updates paidAmount, pendingAmount, and status on the fee.
     */
    @Transactional
    public Payment recordPayment(Long feeId, Payment payment) {
        Fee fee = feeRepository.findById(feeId)
                .orElseThrow(() -> new ResourceNotFoundException("Fee", "id", feeId));

        payment.setFeeId(feeId);
        payment.setStudentId(fee.getStudentId());
        Payment saved = paymentRepository.save(payment);

        // Update fee totals
        BigDecimal newPaid = fee.getPaidAmount().add(payment.getAmountPaid());
        if (newPaid.compareTo(fee.getTotalAmount()) > 0) newPaid = fee.getTotalAmount();
        BigDecimal newPending = fee.getTotalAmount().subtract(newPaid);

        fee.setPaidAmount(newPaid);
        fee.setPendingAmount(newPending);
        fee.setStatus(determineStatus(fee.getTotalAmount(), newPaid));
        feeRepository.save(fee);

        log.info("Recorded payment of {} for fee {} (student {})", payment.getAmountPaid(), feeId, fee.getStudentId());
        return saved;
    }

    public List<Payment> getPaymentsByFee(Long feeId) {
        return paymentRepository.findByFeeIdOrderByPaymentDateDesc(feeId);
    }

    public List<Payment> getPaymentsByStudent(Long studentId) {
        return paymentRepository.findByStudentIdOrderByPaymentDateDesc(studentId);
    }

    private FeeStatus determineStatus(BigDecimal total, BigDecimal paid) {
        if (paid.compareTo(BigDecimal.ZERO) <= 0) {
            return FeeStatus.PENDING;
        } else if (paid.compareTo(total) >= 0 && total.compareTo(BigDecimal.ZERO) > 0) {
            return FeeStatus.PAID;
        } else {
            return FeeStatus.PARTIAL;
        }
    }

    private FeeDTO toDTO(Fee fee) {
        List<Payment> payments = paymentRepository.findByFeeIdOrderByPaymentDateDesc(fee.getId());
        return FeeDTO.builder()
                .id(fee.getId())
                .studentId(fee.getStudentId())
                .admissionNumber(fee.getAdmissionNumber())
                .studentName(fee.getStudentName())
                .className(fee.getClassName())
                .termFees1(fee.getTermFees1())
                .termFees2(fee.getTermFees2())
                .termFees3(fee.getTermFees3())
                .busFees(fee.getBusFees())
                .examFees(fee.getExamFees())
                .totalAmount(fee.getTotalAmount())
                .paidAmount(fee.getPaidAmount())
                .pendingAmount(fee.getPendingAmount())
                .status(fee.getStatus())
                .description(fee.getDescription())
                .academicYear(fee.getAcademicYear())
                .dueDate(fee.getDueDate())
                .payments(payments)
                .build();
    }

    private int naturalClassCompare(String a, String b) {
        if (a == null && b == null) return 0;
        if (a == null) return -1;
        if (b == null) return 1;

        // Try extracting numbers from class names (e.g. "Class 9" vs "Class 10")
        int numA = extractNumber(a);
        int numB = extractNumber(b);

        if (numA != -1 && numB != -1) {
            return Integer.compare(numA, numB);
        }
        return a.compareToIgnoreCase(b);
    }

    private int extractNumber(String s) {
        String numStr = s.replaceAll("\\D+", "");
        if (!numStr.isEmpty()) {
            try {
                return Integer.parseInt(numStr);
            } catch (NumberFormatException ignored) {}
        }
        return -1;
    }
}

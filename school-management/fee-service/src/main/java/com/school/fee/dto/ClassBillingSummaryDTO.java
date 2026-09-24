package com.school.fee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Class-wise Billing Summary DTO for the main table.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassBillingSummaryDTO {
    private Integer sNo;
    private String className;
    private Long totalStudents;
    private BigDecimal totalAmount;
    private BigDecimal totalPaidAmount;
    private BigDecimal totalOutstandingAmount;
}

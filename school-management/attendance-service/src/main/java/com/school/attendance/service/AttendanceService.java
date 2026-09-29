package com.school.attendance.service;

import com.school.attendance.dto.AttendanceDTO;
import com.school.attendance.dto.LeaveRecordDTO;
import com.school.attendance.dto.StudentInfoDTO;
import com.school.attendance.entity.Attendance;
import com.school.attendance.entity.Holiday;
import com.school.attendance.entity.LeaveReason;
import com.school.attendance.entity.LeaveRequest;
import com.school.attendance.repository.AttendanceRepository;
import com.school.attendance.repository.HolidayRepository;
import com.school.attendance.repository.LeaveReasonRepository;
import com.school.attendance.repository.LeaveRequestRepository;
import com.school.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Business logic for Attendance, Holidays, Leave Requests, and Leave Reasons.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final HolidayRepository holidayRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveReasonRepository leaveReasonRepository;
    private final StudentServiceClient studentServiceClient;

    // ---- Attendance ----

    public AttendanceDTO markAttendance(AttendanceDTO dto) {
        Attendance attendance = Attendance.builder()
                .personType(dto.getPersonType())
                .personId(dto.getPersonId())
                .date(dto.getDate())
                .status(dto.getStatus())
                .build();
        Attendance saved = attendanceRepository.save(attendance);
        log.info("Marked attendance for {} {} on {}: {}", dto.getPersonType(), dto.getPersonId(), dto.getDate(), dto.getStatus());
        return toDTO(saved);
    }

    public List<AttendanceDTO> getAttendanceByPerson(com.school.common.enums.PersonType personType, Long personId) {
        return attendanceRepository.findByPersonTypeAndPersonId(personType, personId).stream()
                .map(this::toDTO)
                .toList();
    }

    public AttendanceDTO getTodayAttendance(com.school.common.enums.PersonType personType, Long personId) {
        LocalDate today = LocalDate.now();
        Attendance attendance = attendanceRepository.findByPersonTypeAndPersonIdAndDate(personType, personId, today)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Attendance record not found for " + personType + " " + personId + " today"));
        return toDTO(attendance);
    }

    public List<AttendanceDTO> getTodayAttendanceAll(com.school.common.enums.PersonType personType) {
        LocalDate today = LocalDate.now();
        return attendanceRepository.findByPersonTypeAndDate(personType, today).stream()
                .map(this::toDTO)
                .toList();
    }

    public List<AttendanceDTO> getAttendanceByDateAndType(LocalDate date, com.school.common.enums.PersonType personType) {
        return attendanceRepository.findByPersonTypeAndDate(personType, date).stream()
                .map(this::toDTO)
                .toList();
    }

    private AttendanceDTO toDTO(Attendance attendance) {
        return AttendanceDTO.builder()
                .id(attendance.getId())
                .personType(attendance.getPersonType())
                .personId(attendance.getPersonId())
                .date(attendance.getDate())
                .status(attendance.getStatus())
                .build();
    }

    // ---- Holidays ----

    public List<Holiday> getAllHolidays() {
        return holidayRepository.findAllByOrderByDateAsc();
    }

    public Holiday createHoliday(Holiday holiday) {
        return holidayRepository.save(holiday);
    }

    public Holiday updateHoliday(Long id, Holiday updated) {
        Holiday existing = holidayRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Holiday", "id", id));
        existing.setName(updated.getName());
        existing.setDate(updated.getDate());
        existing.setDescription(updated.getDescription());
        existing.setHolidayType(updated.getHolidayType());
        return holidayRepository.save(existing);
    }

    public void deleteHoliday(Long id) {
        if (!holidayRepository.existsById(id)) {
            throw new ResourceNotFoundException("Holiday", "id", id);
        }
        holidayRepository.deleteById(id);
    }

    // ---- Leave Requests (no approval workflow) ----

    /**
     * Parent submits single-day leave.
     * Status is set to RECORDED directly — no approval workflow.
     */
    public LeaveRecordDTO submitLeave(Long studentId, Long parentId, LeaveRequest request) {
        request.setStudentId(studentId);
        request.setParentId(parentId);
        request.setStatus("RECORDED");
        request.setEndDate(null); // Single-day leave requirement: no end date

        LocalDate effectiveDate = request.getLeaveDate() != null ? request.getLeaveDate() : request.getStartDate();
        if (effectiveDate == null) {
            effectiveDate = LocalDate.now();
        }
        request.setStartDate(effectiveDate);

        LeaveRequest saved = leaveRequestRepository.save(request);
        log.info("Leave submitted for student {} by parent {} on {} — recorded directly as RECORDED",
                studentId, parentId, effectiveDate);

        StudentInfoDTO student = studentServiceClient.getStudentById(studentId);
        return toLeaveRecordDTO(saved, student);
    }

    /**
     * Teacher view: Only returns leave records for students belonging to the teacher's
     * assigned class and section. Backend-enforced authorization.
     */
    public List<LeaveRecordDTO> getTeacherLeaveRecords(String teacherClass, String teacherSection) {
        Map<Long, StudentInfoDTO> studentMap = buildStudentMap();
        List<LeaveRequest> allRequests = leaveRequestRepository.findAllByOrderByCreatedAtDesc();

        return allRequests.stream()
                .filter(lr -> {
                    StudentInfoDTO student = studentMap.get(lr.getStudentId());
                    if (student == null) {
                        student = studentServiceClient.getStudentById(lr.getStudentId());
                        if (student != null) {
                            studentMap.put(student.getId(), student);
                        }
                    }
                    if (student == null) {
                        return false;
                    }
                    return isClassAndSectionMatch(student.getClassName(), student.getSection(), teacherClass, teacherSection);
                })
                .map(lr -> toLeaveRecordDTO(lr, studentMap.get(lr.getStudentId())))
                .collect(Collectors.toList());
    }

    /**
     * Admin view: Returns all school leave records enriched with student details.
     */
    public List<LeaveRecordDTO> getAllLeaveRecordsEnriched() {
        Map<Long, StudentInfoDTO> studentMap = buildStudentMap();
        List<LeaveRequest> allRequests = leaveRequestRepository.findAllByOrderByCreatedAtDesc();

        return allRequests.stream()
                .map(lr -> {
                    StudentInfoDTO student = studentMap.get(lr.getStudentId());
                    if (student == null) {
                        student = studentServiceClient.getStudentById(lr.getStudentId());
                        if (student != null) {
                            studentMap.put(student.getId(), student);
                        }
                    }
                    return toLeaveRecordDTO(lr, student);
                })
                .collect(Collectors.toList());
    }

    /**
     * Parent view: Returns leaves submitted by this parent, enriched with student details.
     */
    public List<LeaveRecordDTO> getMyLeaveRecordsEnriched(Long parentId) {
        Map<Long, StudentInfoDTO> studentMap = buildStudentMap();
        List<LeaveRequest> requests = leaveRequestRepository.findByParentId(parentId);

        return requests.stream()
                .map(lr -> {
                    StudentInfoDTO student = studentMap.get(lr.getStudentId());
                    if (student == null) {
                        student = studentServiceClient.getStudentById(lr.getStudentId());
                        if (student != null) {
                            studentMap.put(student.getId(), student);
                        }
                    }
                    return toLeaveRecordDTO(lr, student);
                })
                .collect(Collectors.toList());
    }

    public List<LeaveRequest> getAllLeaveRequests() {
        return leaveRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<LeaveRequest> getLeaveByParent(Long parentId) {
        return leaveRequestRepository.findByParentId(parentId);
    }

    private Map<Long, StudentInfoDTO> buildStudentMap() {
        try {
            List<StudentInfoDTO> allStudents = studentServiceClient.getAllStudents();
            Map<Long, StudentInfoDTO> map = new HashMap<>();
            for (StudentInfoDTO s : allStudents) {
                if (s.getId() != null) {
                    map.put(s.getId(), s);
                }
            }
            return map;
        } catch (Exception e) {
            log.error("Failed to build student map: {}", e.getMessage());
            return new HashMap<>();
        }
    }

    private LeaveRecordDTO toLeaveRecordDTO(LeaveRequest lr, StudentInfoDTO stu) {
        String studentName = (stu != null && stu.getName() != null && !stu.getName().isBlank())
                ? stu.getName()
                : "Student #" + lr.getStudentId();

        String admissionNumber = (stu != null && stu.getAdmissionNumber() != null && !stu.getAdmissionNumber().isBlank())
                ? stu.getAdmissionNumber()
                : "—";

        String className = (stu != null && stu.getClassName() != null && !stu.getClassName().isBlank())
                ? stu.getClassName()
                : "—";

        String section = (stu != null && stu.getSection() != null)
                ? stu.getSection()
                : "";

        LocalDate leaveDate = lr.getStartDate();

        return LeaveRecordDTO.builder()
                .recordId(lr.getId())
                .id(lr.getId())
                .studentId(lr.getStudentId())
                .studentName(studentName)
                .admissionNumber(admissionNumber)
                .className(className)
                .section(section)
                .leaveDate(leaveDate)
                .startDate(leaveDate)
                .endDate(lr.getEndDate() != null ? lr.getEndDate() : leaveDate)
                .reason(lr.getReason())
                .submittedAt(lr.getCreatedAt())
                .createdAt(lr.getCreatedAt())
                .status("RECORDED")
                .build();
    }

    /**
     * Checks if student's class and section match the teacher's assigned class and section.
     * Supports variations like "Class 10" == "10" == "Class X" == "X".
     */
    public static boolean isClassAndSectionMatch(String studentClass, String studentSection, String teacherClass, String teacherSection) {
        if (teacherClass == null || teacherClass.isBlank()) {
            return true; // No class restriction
        }
        if (studentClass == null || studentClass.isBlank()) {
            return false;
        }

        String normStudent = normalizeClass(studentClass);
        String normTeacher = normalizeClass(teacherClass);

        if (!normStudent.equalsIgnoreCase(normTeacher)) {
            return false;
        }

        if (teacherSection != null && !teacherSection.isBlank()) {
            if (studentSection == null || studentSection.isBlank()) {
                return false;
            }
            return teacherSection.trim().equalsIgnoreCase(studentSection.trim());
        }

        return true;
    }

    private static String normalizeClass(String raw) {
        if (raw == null) return "";
        String s = raw.trim().toUpperCase();
        // Remove prefixes like "CLASS", "GRADE", "STD", "STANDARD"
        s = s.replaceAll("^(CLASS|GRADE|STANDARD|STD)\\s*", "").trim();
        // Map roman numerals to numbers
        switch (s) {
            case "I": return "1";
            case "II": return "2";
            case "III": return "3";
            case "IV": return "4";
            case "V": return "5";
            case "VI": return "6";
            case "VII": return "7";
            case "VIII": return "8";
            case "IX": return "9";
            case "X": return "10";
            case "XI": return "11";
            case "XII": return "12";
            default: return s;
        }
    }

    // ---- Leave Reasons (Admin-managed) ----

    /** Return only active reasons for parent dropdown. */
    public List<LeaveReason> getActiveLeaveReasons() {
        return leaveReasonRepository.findByActiveTrueOrderByEnglishReasonAsc();
    }

    /** Return all reasons (active + inactive) for admin management view. */
    public List<LeaveReason> getAllLeaveReasons() {
        return leaveReasonRepository.findAll();
    }

    public LeaveReason createLeaveReason(LeaveReason reason) {
        reason.setActive(true);
        return leaveReasonRepository.save(reason);
    }

    public LeaveReason updateLeaveReason(Long id, LeaveReason updated) {
        LeaveReason existing = leaveReasonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveReason", "id", id));
        existing.setEnglishReason(updated.getEnglishReason());
        existing.setTamilMeaning(updated.getTamilMeaning());
        return leaveReasonRepository.save(existing);
    }

    /**
     * Soft-delete a leave reason by marking it inactive.
     * Historical leave records that stored the reason text remain untouched.
     */
    public void deactivateLeaveReason(Long id) {
        LeaveReason existing = leaveReasonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveReason", "id", id));
        existing.setActive(false);
        leaveReasonRepository.save(existing);
        log.info("Leave reason id={} deactivated (soft-deleted)", id);
    }

    /**
     * Hard-delete a leave reason if required.
     */
    public void deleteLeaveReason(Long id) {
        if (!leaveReasonRepository.existsById(id)) {
            throw new ResourceNotFoundException("LeaveReason", "id", id);
        }
        leaveReasonRepository.deleteById(id);
        log.info("Leave reason id={} hard deleted", id);
    }

    /**
     * Re-activate a previously deactivated reason.
     */
    public LeaveReason reactivateLeaveReason(Long id) {
        LeaveReason existing = leaveReasonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("LeaveReason", "id", id));
        existing.setActive(true);
        return leaveReasonRepository.save(existing);
    }
}

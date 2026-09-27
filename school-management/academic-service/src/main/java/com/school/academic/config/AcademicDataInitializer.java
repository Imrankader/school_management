package com.school.academic.config;

import com.school.academic.entity.AcademicClass;
import com.school.academic.entity.Exam;
import com.school.academic.entity.Subject;
import com.school.academic.repository.AcademicClassRepository;
import com.school.academic.repository.ExamRepository;
import com.school.academic.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

/**
 * Initializes standard school exams, subjects, and classes on startup if not present.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AcademicDataInitializer implements CommandLineRunner {

    private final ExamRepository examRepository;
    private final SubjectRepository subjectRepository;
    private final AcademicClassRepository classRepository;

    public static final List<String> STANDARD_EXAMS = Arrays.asList(
            "1st Mid Term",
            "2nd Mid Term",
            "3rd Mid Term",
            "Quarterly",
            "Half Yearly",
            "Annual Exam"
    );

    public static final List<String[]> STANDARD_SUBJECTS = Arrays.asList(
            new String[]{"Tamil", "TAM"},
            new String[]{"English", "ENG"},
            new String[]{"Mathematics", "MATH"},
            new String[]{"Science", "SCI"},
            new String[]{"Social Science", "SOC"},
            new String[]{"Physics", "PHY"},
            new String[]{"Chemistry", "CHE"},
            new String[]{"Biology", "BIO"},
            new String[]{"Computer Science", "CS"}
    );

    @Override
    public void run(String... args) {
        initExams();
        initSubjects();
        initClasses();
    }

    private void initExams() {
        List<Exam> existingExams = examRepository.findAll();
        for (String examName : STANDARD_EXAMS) {
            boolean exists = existingExams.stream()
                    .anyMatch(e -> e.getName() != null && e.getName().equalsIgnoreCase(examName));
            if (!exists) {
                Exam exam = Exam.builder()
                        .name(examName)
                        .totalMarks(100)
                        .examDate(LocalDate.now().plusMonths(1))
                        .build();
                examRepository.save(exam);
                log.info("Initialized standard exam: {}", examName);
            }
        }
    }

    private void initSubjects() {
        List<Subject> existingSubjects = subjectRepository.findAll();
        for (String[] sub : STANDARD_SUBJECTS) {
            String name = sub[0];
            String code = sub[1];
            boolean exists = existingSubjects.stream()
                    .anyMatch(s -> s.getName() != null && s.getName().equalsIgnoreCase(name));
            if (!exists) {
                Subject subject = Subject.builder()
                        .name(name)
                        .code(code)
                        .build();
                subjectRepository.save(subject);
                log.info("Initialized standard subject: {} ({})", name, code);
            }
        }
    }

    private void initClasses() {
        List<AcademicClass> existingClasses = classRepository.findAll();
        for (int i = 1; i <= 12; i++) {
            String className = "Class " + i;
            final String numStr = String.valueOf(i);
            boolean exists = existingClasses.stream()
                    .anyMatch(c -> c.getName() != null &&
                            (c.getName().equalsIgnoreCase(className) || c.getName().equalsIgnoreCase(numStr)));
            if (!exists) {
                try {
                    AcademicClass c = AcademicClass.builder()
                            .name(className)
                            .section("A")
                            .build();
                    classRepository.save(c);
                } catch (Exception ignored) {
                }
            }
        }
    }
}

package com.school.auth.service;

import com.school.auth.dto.AuthResponse;
import com.school.auth.dto.LoginRequest;
import com.school.auth.dto.RegisterRequest;
import com.school.auth.dto.UserSummaryDTO;
import com.school.auth.entity.User;
import com.school.auth.repository.UserRepository;
import com.school.auth.security.JwtUtil;
import com.school.common.enums.Role;
import com.school.common.exception.BadRequestException;
import com.school.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

/**
 * Service layer for authentication operations.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final StudentServiceClient studentServiceClient;

    /**
     * Register a new user. For PARENT role, studentId should be provided.
     */
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered: " + request.getEmail());
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .studentId(request.getRole() == Role.PARENT ? request.getStudentId() : null)
                .build();

        User savedUser = userRepository.save(user);
        log.info("Registered new user: {} with role: {}", savedUser.getEmail(), savedUser.getRole());

        String token = jwtUtil.generateToken(
                savedUser.getEmail(),
                savedUser.getRole().name(),
                savedUser.getId(),
                savedUser.getStudentId()
        );
        return AuthResponse.of(token, savedUser.getId(), savedUser.getName(),
                savedUser.getEmail(), savedUser.getRole(), savedUser.getStudentId());
    }

    /**
     * Create a parent user with an explicit studentId. Returns 409 if email already exists.
     */
    public AuthResponse createParent(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A user with email '" + request.getEmail() + "' already exists.");
        }
        if (request.getStudentId() == null) {
            throw new BadRequestException("studentId is required when creating a parent account.");
        }

        // Force role = PARENT regardless of what was sent
        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.PARENT)
                .studentId(request.getStudentId())
                .build();

        User savedUser = userRepository.save(user);
        log.info("Admin created parent account: {} linked to studentId={}", savedUser.getEmail(), savedUser.getStudentId());

        String token = jwtUtil.generateToken(
                savedUser.getEmail(),
                savedUser.getRole().name(),
                savedUser.getId(),
                savedUser.getStudentId()
        );
        return AuthResponse.of(token, savedUser.getId(), savedUser.getName(),
                savedUser.getEmail(), savedUser.getRole(), savedUser.getStudentId());
    }

    /**
     * Authenticate an existing user and return a JWT token.
     * Supports both email (Admin/Teacher/Parent) and phone number (Parent).
     */
    public AuthResponse login(LoginRequest request) {
        String identifier = request.getPhoneNumber() != null && !request.getPhoneNumber().isBlank()
                ? request.getPhoneNumber().trim()
                : (request.getEmail() != null ? request.getEmail().trim() : "");

        if (identifier.isBlank()) {
            throw new BadRequestException("Email or phone number is required");
        }

        // If identifier does not contain '@' (i.e. is a phone number), route to parent login
        if (!identifier.contains("@")) {
            return parentLogin(com.school.auth.dto.ParentLoginRequest.builder()
                    .phoneNumber(identifier)
                    .password(request.getPassword())
                    .build());
        }

        // Try standard email login
        java.util.Optional<User> userOpt = userRepository.findByEmail(identifier);
        if (userOpt.isEmpty()) {
            // In case a phone number was passed that somehow contained characters or was registered as phone
            try {
                return parentLogin(com.school.auth.dto.ParentLoginRequest.builder()
                        .phoneNumber(identifier)
                        .password(request.getPassword())
                        .build());
            } catch (Exception e) {
                throw new BadRequestException("Invalid email or password");
            }
        }

        User user = userOpt.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadRequestException("Invalid email or password");
        }

        log.info("User logged in: {}", user.getEmail());
        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name(),
                user.getId(),
                user.getStudentId()
        );
        return AuthResponse.of(token, user.getId(), user.getName(),
                user.getEmail(), user.getRole(), user.getStudentId());
    }

    /**
     * Authenticate parent by phone number + password against credentials stored in student-service.
     */
    public AuthResponse parentLogin(com.school.auth.dto.ParentLoginRequest request) {
        if (request.getPhoneNumber() == null || request.getPhoneNumber().trim().isBlank()) {
            throw new BadRequestException("Phone number is required");
        }
        if (request.getPassword() == null || request.getPassword().trim().isBlank()) {
            throw new BadRequestException("Password is required");
        }

        String phone = request.getPhoneNumber().trim();
        com.school.auth.dto.StudentAuthDTO student = studentServiceClient.verifyParentCredentials(phone, request.getPassword());
        if (student == null || student.getStudentId() == null) {
            throw new BadRequestException("Unable to resolve student for these credentials");
        }

        // Find or create parent user in auth-service users table so userId is consistent
        User user = userRepository.findByEmail(phone)
                .or(() -> userRepository.findFirstByRoleAndStudentId(Role.PARENT, student.getStudentId()))
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .name(student.getStudentName() != null ? student.getStudentName() + " (Parent)" : "Parent")
                            .email(phone)
                            .password(passwordEncoder.encode(request.getPassword()))
                            .role(Role.PARENT)
                            .studentId(student.getStudentId())
                            .build();
                    return userRepository.save(newUser);
                });

        // Ensure user's studentId, name, and phone/email are in sync with the resolved student
        boolean changed = false;
        if (!student.getStudentId().equals(user.getStudentId())) {
            user.setStudentId(student.getStudentId());
            changed = true;
        }
        if (student.getStudentName() != null && !student.getStudentName().isBlank()) {
            user.setName(student.getStudentName() + " (Parent)");
            changed = true;
        }
        if (!phone.equals(user.getEmail()) && !userRepository.existsByEmail(phone)) {
            user.setEmail(phone);
            changed = true;
        }
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        changed = true;

        if (changed) {
            user = userRepository.save(user);
        }


        log.info("Parent logged in successfully: phone={}, studentId={}", phone, student.getStudentId());
        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getRole().name(),
                user.getId(),
                student.getStudentId()
        );
        return AuthResponse.of(token, user.getId(), user.getName(),
                user.getEmail(), user.getRole(), student.getStudentId());
    }

    /**
     * Fetch all users by role (e.g. all PARENTs for Admin dropdown).
     */
    public List<UserSummaryDTO> getUsersByRole(String roleName) {
        Role role = Role.valueOf(roleName);
        return userRepository.findByRole(role).stream()
                .map(u -> UserSummaryDTO.builder()
                        .id(u.getId())
                        .name(u.getName())
                        .email(u.getEmail())
                        .studentId(u.getStudentId())
                        .build())
                .toList();
    }
}

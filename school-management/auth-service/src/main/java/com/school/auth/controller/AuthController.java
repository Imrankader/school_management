package com.school.auth.controller;

import com.school.auth.dto.AuthResponse;
import com.school.auth.dto.LoginRequest;
import com.school.auth.dto.RegisterRequest;
import com.school.auth.dto.UserSummaryDTO;
import com.school.auth.security.JwtUtil;
import com.school.auth.service.UserService;
import com.school.common.dto.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.util.StringUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller exposing authentication endpoints.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    /**
     * POST /api/auth/register — Create a new user (any role). Only an ADMIN may call this.
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @Valid @RequestBody RegisterRequest request) {
        if (!isAdmin(authHeader)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        AuthResponse authResponse = userService.register(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", authResponse));
    }

    /**
     * POST /api/auth/login — Authenticate user and return JWT.
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse authResponse = userService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    /**
     * POST /api/auth/parent-login — Authenticate parent via phone number + password.
     */
    @PostMapping("/parent-login")
    public ResponseEntity<ApiResponse<AuthResponse>> parentLogin(@Valid @RequestBody com.school.auth.dto.ParentLoginRequest request) {
        AuthResponse authResponse = userService.parentLogin(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", authResponse));
    }

    /**
     * GET /api/auth/parents — Fetch all users with role PARENT (for Admin dropdown).
     */
    @GetMapping("/parents")
    public ResponseEntity<ApiResponse<List<UserSummaryDTO>>> getParents() {
        List<UserSummaryDTO> parents = userService.getUsersByRole("PARENT");
        return ResponseEntity.ok(ApiResponse.success(parents));
    }

    /**
     * POST /api/auth/parents — Admin creates a parent account linked to a student.
     * Request body: { name, email, password, studentId }
     * Returns 409 Conflict if email already exists.
     * Returns 400 Bad Request if studentId is missing.
     */
    @PostMapping("/parents")
    public ResponseEntity<ApiResponse<AuthResponse>> createParent(@Valid @RequestBody RegisterRequest request) {
        AuthResponse authResponse = userService.createParent(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Parent account created and linked to student", authResponse));
    }

    private boolean isAdmin(String authHeader) {
        if (!StringUtils.hasText(authHeader) || !authHeader.startsWith("Bearer ")) {
            return false;
        }
        try {
            String token = authHeader.substring(7);
            return jwtUtil.validateToken(token) && "ADMIN".equals(jwtUtil.getRoleFromToken(token));
        } catch (Exception e) {
            return false;
        }
    }
}

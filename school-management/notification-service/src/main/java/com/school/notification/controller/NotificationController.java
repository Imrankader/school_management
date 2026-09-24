package com.school.notification.controller;

import com.school.common.dto.ApiResponse;
import com.school.notification.dto.NotificationDTO;
import com.school.notification.security.JwtDecoder;
import com.school.notification.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for Notification management.
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtDecoder jwtDecoder;

    /** POST /api/notifications — Admin sends a notification */
    @PostMapping
    public ResponseEntity<ApiResponse<NotificationDTO>> sendNotification(
            @Valid @RequestBody NotificationDTO dto,
            HttpServletRequest request) {
        // Verify caller is ADMIN
        String token = jwtDecoder.extractRaw(request.getHeader("Authorization"));
        String role = (token != null) ? jwtDecoder.getRole(token) : null;
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only ADMIN can send notifications"));
        }

        NotificationDTO sent = notificationService.sendNotification(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Notification sent", sent));
    }

    /** GET /api/notifications/history — Admin views all notification history */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<NotificationDTO>>> getHistory(HttpServletRequest request) {
        String token = jwtDecoder.extractRaw(request.getHeader("Authorization"));
        String role = (token != null) ? jwtDecoder.getRole(token) : null;
        if (!"ADMIN".equals(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Only ADMIN can view notification history"));
        }

        List<NotificationDTO> history = notificationService.getAllNotifications();
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    /** GET /api/notifications/my — Students/Teachers fetch their applicable notifications */
    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<NotificationDTO>>> getMyNotifications(HttpServletRequest request) {
        String token = jwtDecoder.extractRaw(request.getHeader("Authorization"));
        if (token == null || !jwtDecoder.isValidToken(token)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Invalid or missing token"));
        }

        String role = jwtDecoder.getRole(token);

        // Map user role to audience filter
        String audienceFilter;
        if ("TEACHER".equals(role)) {
            audienceFilter = "TEACHERS";
        } else if ("PARENT".equals(role)) {
            // Parents see student notifications (students are children of parents)
            audienceFilter = "STUDENTS";
        } else if ("ADMIN".equals(role)) {
            // Admin can see all
            List<NotificationDTO> all = notificationService.getAllNotifications();
            return ResponseEntity.ok(ApiResponse.success(all));
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Unknown role"));
        }

        List<NotificationDTO> notifications = notificationService.getNotificationsForRole(audienceFilter);
        return ResponseEntity.ok(ApiResponse.success(notifications));
    }
}

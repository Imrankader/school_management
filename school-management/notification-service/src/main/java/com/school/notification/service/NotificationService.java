package com.school.notification.service;

import com.school.notification.dto.NotificationDTO;
import com.school.notification.entity.Notification;
import com.school.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Business logic for Notification management.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    /** Admin sends a notification to an audience */
    public NotificationDTO sendNotification(NotificationDTO dto) {
        Notification notification = Notification.builder()
                .date(dto.getDate())
                .audience(dto.getAudience().toUpperCase())
                .message(dto.getMessage())
                .status("SENT")
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Notification sent to {}: {}", dto.getAudience(), dto.getMessage());
        return toDTO(saved);
    }

    /** Admin views all notification history */
    public List<NotificationDTO> getAllNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .toList();
    }

    /** Students/Teachers fetch notifications for their role */
    public List<NotificationDTO> getNotificationsForRole(String role) {
        // role is STUDENTS or TEACHERS — query returns matching + BOTH
        return notificationRepository.findByAudienceForRole(role.toUpperCase()).stream()
                .map(this::toDTO)
                .toList();
    }

    private NotificationDTO toDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .date(notification.getDate())
                .audience(notification.getAudience())
                .message(notification.getMessage())
                .status(notification.getStatus())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}

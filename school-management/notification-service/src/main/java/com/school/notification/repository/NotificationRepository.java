package com.school.notification.repository;

import com.school.notification.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Notification entity.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    /** All notifications, newest first — for Admin history */
    List<Notification> findAllByOrderByCreatedAtDesc();

    /** Notifications visible to a specific audience role (e.g. STUDENTS sees STUDENTS + BOTH) */
    @Query("SELECT n FROM Notification n WHERE n.audience = :role OR n.audience = 'BOTH' ORDER BY n.createdAt DESC")
    List<Notification> findByAudienceForRole(@Param("role") String role);
}

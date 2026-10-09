package com.taste.backend.notification;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop50ByRecipientIdOrderByCreatedAtDesc(Long recipientId);

    long countByRecipientIdAndReadFalse(Long recipientId);

    Optional<Notification> findByIdAndRecipientId(Long id, Long recipientId);

    boolean existsByRecipientIdAndActorIdAndTypeAndExperienceId(
            Long recipientId, Long actorId, Notification.Type type, Long experienceId);

    @Modifying
    @Query("update Notification n set n.read = true where n.recipient.id = :recipientId and n.read = false")
    int markAllRead(@Param("recipientId") Long recipientId);

    @Modifying
    @Query("delete from Notification n where n.experience.id = :experienceId")
    void deleteByExperienceId(@Param("experienceId") Long experienceId);

    @Modifying
    @Query("""
            delete from Notification n
            where n.type = :type and n.recipient.id = :recipientId and n.actor.id = :actorId
              and (:experienceId is null or n.experience.id = :experienceId)
            """)
    void deleteMatching(
            @Param("type") Notification.Type type,
            @Param("recipientId") Long recipientId,
            @Param("actorId") Long actorId,
            @Param("experienceId") Long experienceId);
}

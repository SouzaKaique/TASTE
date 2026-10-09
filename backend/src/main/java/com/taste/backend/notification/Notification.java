package com.taste.backend.notification;

import com.taste.backend.experience.Experience;
import com.taste.backend.user.User;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "notification", indexes = {
        @Index(name = "idx_notification_recipient", columnList = "recipient_id, createdAt")
})
public class Notification {

    public enum Type { FRIEND_REQUEST, FRIEND_ACCEPTED, LIKE, COMMENT }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Type type;

    /** Experiencia relacionada (curtida/comentario); nula em notificacoes de amizade. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "experience_id")
    private Experience experience;

    /** Trecho do comentario, para mostrar na lista. */
    @Column(length = 140)
    private String snippet;

    @Column(name = "is_read", nullable = false)
    private boolean read = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Notification() {
    }

    public Notification(User recipient, User actor, Type type, Experience experience, String snippet) {
        this.recipient = recipient;
        this.actor = actor;
        this.type = type;
        this.experience = experience;
        this.snippet = snippet;
    }

    public Long getId() {
        return id;
    }

    public User getRecipient() {
        return recipient;
    }

    public User getActor() {
        return actor;
    }

    public Type getType() {
        return type;
    }

    public Experience getExperience() {
        return experience;
    }

    public String getSnippet() {
        return snippet;
    }

    public boolean isRead() {
        return read;
    }

    public void setRead(boolean read) {
        this.read = read;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

package com.taste.backend.social;

import com.taste.backend.user.User;
import jakarta.persistence.*;

import java.time.Instant;

/**
 * Relacao de amizade entre dois usuarios. Existe no maximo uma linha por par
 * (em qualquer direcao): enquanto PENDING, "requester" enviou o pedido para "addressee".
 */
@Entity
@Table(name = "friendship", uniqueConstraints = {
        @UniqueConstraint(name = "uk_friendship_pair", columnNames = {"requester_id", "addressee_id"})
})
public class Friendship {

    public enum Status { PENDING, ACCEPTED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "addressee_id", nullable = false)
    private User addressee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Friendship() {
    }

    public Friendship(User requester, User addressee) {
        this.requester = requester;
        this.addressee = addressee;
    }

    /** O outro lado da amizade, do ponto de vista de userId. */
    public User otherThan(Long userId) {
        return requester.getId().equals(userId) ? addressee : requester;
    }

    public Long getId() {
        return id;
    }

    public User getRequester() {
        return requester;
    }

    public User getAddressee() {
        return addressee;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

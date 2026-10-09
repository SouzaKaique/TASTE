package com.taste.backend.social;

import com.taste.backend.experience.Experience;
import com.taste.backend.user.User;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "experience_like", uniqueConstraints = {
        @UniqueConstraint(name = "uk_like_experience_user", columnNames = {"experience_id", "user_id"})
})
public class ExperienceLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "experience_id", nullable = false)
    private Experience experience;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ExperienceLike() {
    }

    public ExperienceLike(Experience experience, User user) {
        this.experience = experience;
        this.user = user;
    }

    public Long getId() {
        return id;
    }

    public Experience getExperience() {
        return experience;
    }

    public User getUser() {
        return user;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

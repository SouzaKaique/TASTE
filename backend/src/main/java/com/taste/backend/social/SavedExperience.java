package com.taste.backend.social;

import com.taste.backend.experience.Experience;
import com.taste.backend.user.User;
import jakarta.persistence.*;

import java.time.Instant;

/** Lista "Quero ir": um post que a pessoa salvou para visitar o lugar depois. */
@Entity
@Table(name = "saved_experience", uniqueConstraints = {
        @UniqueConstraint(name = "uk_saved_experience_user", columnNames = {"experience_id", "user_id"})
})
public class SavedExperience {

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

    public SavedExperience() {
    }

    public SavedExperience(Experience experience, User user) {
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

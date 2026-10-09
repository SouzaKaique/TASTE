package com.taste.backend.social;

import com.taste.backend.experience.Experience;
import com.taste.backend.user.User;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "experience_comment")
public class ExperienceComment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "experience_id", nullable = false)
    private Experience experience;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 500)
    private String text;

    @Column(nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public ExperienceComment() {
    }

    public ExperienceComment(Experience experience, User user, String text) {
        this.experience = experience;
        this.user = user;
        this.text = text;
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

    public String getText() {
        return text;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}

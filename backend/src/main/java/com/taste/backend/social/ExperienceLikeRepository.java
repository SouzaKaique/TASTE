package com.taste.backend.social;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ExperienceLikeRepository extends JpaRepository<ExperienceLike, Long> {

    Optional<ExperienceLike> findByExperienceIdAndUserId(Long experienceId, Long userId);

    long countByExperienceId(Long experienceId);

    boolean existsByExperienceIdAndUserId(Long experienceId, Long userId);

    @Modifying
    @Query("delete from ExperienceLike l where l.experience.id = :experienceId")
    void deleteByExperienceId(@Param("experienceId") Long experienceId);
}

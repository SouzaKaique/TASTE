package com.taste.backend.social;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ExperienceCommentRepository extends JpaRepository<ExperienceComment, Long> {

    List<ExperienceComment> findByExperienceIdOrderByCreatedAtAsc(Long experienceId);

    Optional<ExperienceComment> findByIdAndExperienceId(Long id, Long experienceId);

    @Modifying
    @Query("delete from ExperienceComment c where c.experience.id = :experienceId")
    void deleteByExperienceId(@Param("experienceId") Long experienceId);
}

package com.taste.backend.social;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SavedExperienceRepository extends JpaRepository<SavedExperience, Long> {

    Optional<SavedExperience> findByExperienceIdAndUserId(Long experienceId, Long userId);

    boolean existsByExperienceIdAndUserId(Long experienceId, Long userId);

    List<SavedExperience> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Modifying
    @Query("delete from SavedExperience s where s.experience.id = :experienceId")
    void deleteByExperienceId(@Param("experienceId") Long experienceId);

    @Modifying
    @Query("delete from SavedExperience s where s.user.id in :userIds or s.experience.id in (select e.id from com.taste.backend.experience.Experience e where e.user.id in :userIds)")
    void deleteInvolvingUsers(@Param("userIds") java.util.Collection<Long> userIds);
}

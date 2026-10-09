package com.taste.backend.experience;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ExperienceRepository extends JpaRepository<Experience, Long> {
    List<Experience> findByUserIdOrderByDateDesc(Long userId);

    Optional<Experience> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);

    long countByUserIdAndFavoriteTrue(Long userId);

    @Query("select count(distinct e.city) from Experience e where e.user.id = :userId")
    long countDistinctCitiesByUserId(@Param("userId") Long userId);

    @Query("select count(distinct e.restaurantName) from Experience e where e.user.id = :userId")
    long countDistinctRestaurantsByUserId(@Param("userId") Long userId);

    @Query("select avg(e.rating) from Experience e where e.user.id = :userId")
    Double averageRatingByUserId(@Param("userId") Long userId);
}

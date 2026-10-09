package com.taste.backend.experience;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ExperienceRepository extends JpaRepository<Experience, Long> {
    List<Experience> findByUserIdOrderByDateDesc(Long userId);

    Optional<Experience> findByIdAndUserId(Long id, Long userId);

    /** Experiencias nao privadas de um conjunto de usuarios, mais recentes primeiro (feed). */
    @Query("""
            select e from Experience e
            where e.user.id in :userIds and e.visibility <> 'private'
            order by e.createdAt desc
            """)
    List<Experience> findFeed(@Param("userIds") Collection<Long> userIds, Pageable pageable);

    /**
     * Candidatas a capa de restaurante: experiencias publicas, com foto, de perfis publicos.
     * Devolve pares [restaurantId, experienceId], das mais recentes para as mais antigas.
     */
    @Query("""
            select e.restaurantId, e.id from Experience e
            where e.restaurantId in :restaurantIds
              and e.visibility = 'public'
              and e.photoUrl is not null
              and e.user.profileVisibility = com.taste.backend.user.ProfileVisibility.PUBLIC
            order by e.createdAt desc
            """)
    List<Object[]> findCoverCandidates(@Param("restaurantIds") Collection<String> restaurantIds);

    long countByUserId(Long userId);

    long countByUserIdAndFavoriteTrue(Long userId);

    @Query("select count(distinct e.city) from Experience e where e.user.id = :userId")
    long countDistinctCitiesByUserId(@Param("userId") Long userId);

    @Query("select count(distinct e.restaurantName) from Experience e where e.user.id = :userId")
    long countDistinctRestaurantsByUserId(@Param("userId") Long userId);

    @Query("select avg(e.rating) from Experience e where e.user.id = :userId")
    Double averageRatingByUserId(@Param("userId") Long userId);
}

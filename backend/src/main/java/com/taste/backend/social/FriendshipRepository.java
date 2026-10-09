package com.taste.backend.social;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    @Query("""
            select f from Friendship f
            where (f.requester.id = :a and f.addressee.id = :b)
               or (f.requester.id = :b and f.addressee.id = :a)
            """)
    Optional<Friendship> findBetween(@Param("a") Long a, @Param("b") Long b);

    @Query("select f from Friendship f where f.requester.id = :userId or f.addressee.id = :userId")
    List<Friendship> findAllInvolving(@Param("userId") Long userId);

    @Query("""
            select f from Friendship f
            where f.status = com.taste.backend.social.Friendship.Status.ACCEPTED
              and (f.requester.id = :userId or f.addressee.id = :userId)
            """)
    List<Friendship> findAccepted(@Param("userId") Long userId);

    List<Friendship> findByAddresseeIdAndStatusOrderByCreatedAtDesc(Long addresseeId, Friendship.Status status);
}

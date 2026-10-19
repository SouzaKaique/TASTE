package com.taste.backend.push;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    List<PushSubscription> findByUserId(Long userId);

    Optional<PushSubscription> findByEndpoint(String endpoint);

    /** Chamado fora de transacao (thread de envio), por isso tem a propria. */
    @Transactional
    @Modifying
    @Query("delete from PushSubscription s where s.endpoint = :endpoint")
    void deleteByEndpoint(@Param("endpoint") String endpoint);

    @Modifying
    @Query("delete from PushSubscription s where s.endpoint = :endpoint and s.user.id = :userId")
    void deleteByEndpointAndUserId(@Param("endpoint") String endpoint, @Param("userId") Long userId);

    @Modifying
    @Query("delete from PushSubscription s where s.user.id in :userIds")
    void deleteByUserIds(@Param("userIds") Collection<Long> userIds);
}

package com.taste.backend.user;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByUsernameIgnoreCase(String username);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    /** Busca por username ou nome de exibicao, sem incluir o proprio usuario. */
    @Query("""
            select u from User u
            where u.id <> :excludeId
              and (lower(u.username) like lower(concat('%', :term, '%'))
                   or lower(u.displayName) like lower(concat('%', :term, '%')))
            order by u.displayName
            """)
    List<User> search(@Param("excludeId") Long excludeId, @Param("term") String term, Pageable pageable);

    /** Sugestoes quando a busca esta vazia: usuarios mais recentes. */
    List<User> findByIdNotOrderByCreatedAtDesc(Long excludeId, Pageable pageable);
}

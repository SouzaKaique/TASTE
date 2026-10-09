package com.taste.backend.social;

import com.taste.backend.common.BadRequestException;
import com.taste.backend.common.NotFoundException;
import com.taste.backend.notification.NotificationService;
import com.taste.backend.social.dto.UserSummaryResponse;
import com.taste.backend.user.User;
import com.taste.backend.user.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class FriendshipService {

    static final String NONE = "none";
    static final String PENDING_SENT = "pending-sent";
    static final String PENDING_RECEIVED = "pending-received";
    static final String FRIENDS = "friends";
    static final String SELF = "self";

    private static final int SEARCH_LIMIT = 20;

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public FriendshipService(FriendshipRepository friendshipRepository, UserRepository userRepository, NotificationService notificationService) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    // ---- Consultas usadas por outros modulos ----

    @Transactional(readOnly = true)
    public String statusBetween(Long me, Long other) {
        if (me.equals(other)) {
            return SELF;
        }
        return friendshipRepository.findBetween(me, other).map(f -> statusFor(me, f)).orElse(NONE);
    }

    @Transactional(readOnly = true)
    public boolean areFriends(Long a, Long b) {
        return FRIENDS.equals(statusBetween(a, b));
    }

    @Transactional(readOnly = true)
    public Set<Long> friendIds(Long me) {
        return friendshipRepository.findAccepted(me).stream()
                .map(f -> f.otherThan(me).getId())
                .collect(Collectors.toSet());
    }

    public UserSummaryResponse summaryOf(Long me, User user) {
        return UserSummaryResponse.of(user, statusBetween(me, user.getId()));
    }

    // ---- Operacoes da tela de amigos ----

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> search(Long me, String term) {
        String normalized = term == null ? "" : term.trim();
        List<User> users = normalized.isEmpty()
                ? userRepository.findByIdNotOrderByCreatedAtDesc(me, PageRequest.of(0, SEARCH_LIMIT))
                : userRepository.search(me, normalized, PageRequest.of(0, SEARCH_LIMIT));

        Map<Long, String> statuses = statusMap(me);
        return users.stream()
                .map(u -> UserSummaryResponse.of(u, statuses.getOrDefault(u.getId(), NONE)))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> friends(Long me) {
        return friendshipRepository.findAccepted(me).stream()
                .map(f -> UserSummaryResponse.of(f.otherThan(me), FRIENDS))
                .sorted((a, b) -> a.displayName().compareToIgnoreCase(b.displayName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<UserSummaryResponse> pendingReceived(Long me) {
        return friendshipRepository.findByAddresseeIdAndStatusOrderByCreatedAtDesc(me, Friendship.Status.PENDING).stream()
                .map(f -> UserSummaryResponse.of(f.getRequester(), PENDING_RECEIVED))
                .toList();
    }

    /** Envia um pedido. Se o outro ja tinha enviado um pedido para mim, aceita. */
    public UserSummaryResponse sendRequest(Long me, Long otherId) {
        if (me.equals(otherId)) {
            throw new BadRequestException("Você não pode adicionar a si mesmo.");
        }
        User other = findUser(otherId);

        Friendship friendship = friendshipRepository.findBetween(me, otherId).orElse(null);
        if (friendship == null) {
            User requester = findUser(me);
            friendshipRepository.save(new Friendship(requester, other));
            notificationService.friendRequest(requester, other);
            return UserSummaryResponse.of(other, PENDING_SENT);
        }
        if (friendship.getStatus() == Friendship.Status.PENDING && friendship.getAddressee().getId().equals(me)) {
            friendship.setStatus(Friendship.Status.ACCEPTED);
            notificationService.friendAccepted(friendship.getAddressee(), friendship.getRequester());
        }
        return UserSummaryResponse.of(other, statusFor(me, friendship));
    }

    public UserSummaryResponse accept(Long me, Long otherId) {
        Friendship friendship = friendshipRepository.findBetween(me, otherId)
                .filter(f -> f.getStatus() == Friendship.Status.PENDING && f.getAddressee().getId().equals(me))
                .orElseThrow(() -> new NotFoundException("Solicitação de amizade não encontrada."));
        friendship.setStatus(Friendship.Status.ACCEPTED);
        notificationService.friendAccepted(friendship.getAddressee(), friendship.getRequester());
        return UserSummaryResponse.of(friendship.getRequester(), FRIENDS);
    }

    /** Recusa um pedido recebido, cancela um pedido enviado ou desfaz a amizade. */
    public void remove(Long me, Long otherId) {
        friendshipRepository.findBetween(me, otherId).ifPresent(friendshipRepository::delete);
        notificationService.friendshipRemoved(me, otherId);
    }

    private Map<Long, String> statusMap(Long me) {
        Map<Long, String> map = new HashMap<>();
        for (Friendship f : friendshipRepository.findAllInvolving(me)) {
            map.put(f.otherThan(me).getId(), statusFor(me, f));
        }
        return map;
    }

    private String statusFor(Long me, Friendship f) {
        if (f.getStatus() == Friendship.Status.ACCEPTED) {
            return FRIENDS;
        }
        return f.getRequester().getId().equals(me) ? PENDING_SENT : PENDING_RECEIVED;
    }

    private User findUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new NotFoundException("Usuário não encontrado."));
    }
}

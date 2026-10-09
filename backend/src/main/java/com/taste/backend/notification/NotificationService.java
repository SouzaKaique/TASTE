package com.taste.backend.notification;

import com.taste.backend.common.NotFoundException;
import com.taste.backend.experience.Experience;
import com.taste.backend.user.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class NotificationService {

    private final NotificationRepository repository;

    public NotificationService(NotificationRepository repository) {
        this.repository = repository;
    }

    // ---- Eventos (chamados por amizades e feed) ----

    public void friendRequest(User from, User to) {
        if (sameUser(from, to)) return;
        repository.deleteMatching(Notification.Type.FRIEND_REQUEST, to.getId(), from.getId(), null);
        repository.save(new Notification(to, from, Notification.Type.FRIEND_REQUEST, null, null));
    }

    /** "accepter" aceitou o pedido de "requester": avisa quem pediu e limpa o aviso de pedido. */
    public void friendAccepted(User accepter, User requester) {
        if (sameUser(accepter, requester)) return;
        repository.deleteMatching(Notification.Type.FRIEND_REQUEST, accepter.getId(), requester.getId(), null);
        repository.save(new Notification(requester, accepter, Notification.Type.FRIEND_ACCEPTED, null, null));
    }

    /** Pedido recusado/cancelado ou amizade desfeita: remove pedidos pendentes entre os dois. */
    public void friendshipRemoved(Long a, Long b) {
        repository.deleteMatching(Notification.Type.FRIEND_REQUEST, a, b, null);
        repository.deleteMatching(Notification.Type.FRIEND_REQUEST, b, a, null);
    }

    public void liked(User actor, Experience experience) {
        User owner = experience.getUser();
        if (sameUser(actor, owner)) return;
        // Curtir/descurtir varias vezes nao gera avisos repetidos
        if (repository.existsByRecipientIdAndActorIdAndTypeAndExperienceId(owner.getId(), actor.getId(), Notification.Type.LIKE, experience.getId())) {
            return;
        }
        repository.save(new Notification(owner, actor, Notification.Type.LIKE, experience, null));
    }

    public void unliked(User actor, Experience experience) {
        repository.deleteMatching(Notification.Type.LIKE, experience.getUser().getId(), actor.getId(), experience.getId());
    }

    public void commented(User actor, Experience experience, String text) {
        User owner = experience.getUser();
        if (sameUser(actor, owner)) return;
        String snippet = text.length() > 120 ? text.substring(0, 117) + "..." : text;
        repository.save(new Notification(owner, actor, Notification.Type.COMMENT, experience, snippet));
    }

    public void experienceDeleted(Long experienceId) {
        repository.deleteByExperienceId(experienceId);
    }

    // ---- Leitura ----

    @Transactional(readOnly = true)
    public List<NotificationResponse> list(Long me) {
        return repository.findTop50ByRecipientIdOrderByCreatedAtDesc(me).stream().map(NotificationResponse::of).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long me) {
        return repository.countByRecipientIdAndReadFalse(me);
    }

    public void markAllRead(Long me) {
        repository.markAllRead(me);
    }

    public void markRead(Long me, Long id) {
        Notification notification = repository.findByIdAndRecipientId(id, me)
                .orElseThrow(() -> new NotFoundException("Notificação não encontrada."));
        notification.setRead(true);
    }

    private static boolean sameUser(User a, User b) {
        return a.getId().equals(b.getId());
    }
}

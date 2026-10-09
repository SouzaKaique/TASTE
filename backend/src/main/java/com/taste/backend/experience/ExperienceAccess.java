package com.taste.backend.experience;

import com.taste.backend.social.FriendshipService;
import com.taste.backend.user.ProfileVisibility;
import com.taste.backend.user.User;
import org.springframework.stereotype.Component;

/**
 * Regras de quem pode ver uma experiencia. Usadas por detalhe, perfil e feed,
 * para que todas as telas sigam exatamente a mesma politica:
 * - o dono sempre ve;
 * - perfil privado: so amigos veem (e nunca experiencias "private");
 * - "public": qualquer usuario logado; "friends": so amigos; "private": so o dono.
 */
@Component
public class ExperienceAccess {

    private final FriendshipService friendshipService;

    public ExperienceAccess(FriendshipService friendshipService) {
        this.friendshipService = friendshipService;
    }

    public boolean canView(Long viewerId, Experience experience) {
        User owner = experience.getUser();
        if (owner.getId().equals(viewerId)) {
            return true;
        }
        if ("private".equals(experience.getVisibility())) {
            return false;
        }
        boolean friends = friendshipService.areFriends(viewerId, owner.getId());
        if (owner.getProfileVisibility() == ProfileVisibility.PRIVATE && !friends) {
            return false;
        }
        return "public".equals(experience.getVisibility()) || friends;
    }
}

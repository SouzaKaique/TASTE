package com.taste.backend.user;

import com.taste.backend.common.NotFoundException;
import com.taste.backend.social.FriendshipService;
import com.taste.backend.social.dto.UserSummaryResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;

/** Links de convite: cada pessoa tem um codigo; quem entra por ele vira amigo dela. */
@Service
@Transactional
public class InviteService {

    private static final String ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"; // sem letras parecidas (l/1, o/0)
    private static final int CODE_LENGTH = 10;

    public record InviteCode(String code) { }

    /** Dados publicos de quem convidou, para a pagina do convite. */
    public record Inviter(String displayName, String username, String avatarUrl) { }

    private final UserRepository userRepository;
    private final FriendshipService friendshipService;
    private final SecureRandom random = new SecureRandom();

    public InviteService(UserRepository userRepository, FriendshipService friendshipService) {
        this.userRepository = userRepository;
        this.friendshipService = friendshipService;
    }

    public InviteCode codeFor(Long me) {
        User user = userRepository.findById(me).orElseThrow(() -> new NotFoundException("Usuário não encontrado."));
        if (user.getInviteCode() == null) {
            String code;
            do {
                code = randomCode();
            } while (userRepository.existsByInviteCode(code));
            user.setInviteCode(code);
        }
        return new InviteCode(user.getInviteCode());
    }

    @Transactional(readOnly = true)
    public Inviter inviter(String code) {
        User user = findByCode(code);
        return new Inviter(user.getDisplayName(), user.getUsername(), user.getAvatarUrl());
    }

    public UserSummaryResponse accept(Long me, String code) {
        return friendshipService.connectByInvite(me, findByCode(code).getId());
    }

    private User findByCode(String code) {
        return userRepository.findByInviteCode(code == null ? "" : code.trim().toLowerCase())
                .orElseThrow(() -> new NotFoundException("Convite não encontrado."));
    }

    private String randomCode() {
        StringBuilder sb = new StringBuilder(CODE_LENGTH);
        for (int i = 0; i < CODE_LENGTH; i++) {
            sb.append(ALPHABET.charAt(random.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
